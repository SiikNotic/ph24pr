# Database schema notes

The schema lives in this Supabase project's migration history (applied via
the Supabase management API), not as SQL files in this repo. This document
is a reference if you need to reproduce it in a new project.

## Enums

`app_role`, `customer_type`, `driver_status`, `vehicle_type`, `route_status`,
`stop_status`, `priority_level`, `return_reason`, `return_status`,
`availability_status`, `notification_type` — see `src/types/domain.ts` for
the exact value sets, which mirror these one-to-one.

## Tables

- **profiles** — 1:1 with `auth.users`, carries `role`. Auto-created by a
  `handle_new_user()` trigger on `auth.users` insert (defaults to `staff`
  unless `raw_user_meta_data.role` is set).
- **customers** — pharmacies/clinics/hospitals/nursing homes/patients.
- **drivers** — 1:1 with `profiles` (only for `role = 'driver'`), vehicle +
  compliance fields (HIPAA cert, background check, license expiry).
- **routes** — a day's delivery run, optionally assigned to a `driver_id`.
- **route_stops** — ordered stops on a route; denormalizes customer
  name/address so a driver's app never needs `customers` access directly.
- **packages** — one row per physical package within a `route_stop`, each
  with its own unique `code` and `qr_payload`, generated once client-side
  at creation time and never regenerated. `label_printed`/`printed_at`/
  `print_count` track printing; reprinting only ever updates these fields
  on the existing row (see `increment_package_print()` below) — it never
  inserts a new package.
- **route_assignment_history** — append-only audit trail of every
  driver_id change on a route (previous/new driver, who made the change,
  when, the route's status at that moment, and a reason). The only writer
  is `reassign_route_driver()` (below) — there are no insert/update/delete
  RLS policies, so the client can never touch it directly.
- **time_off_requests** — driver/staff time-off requests (pending/approved/
  rejected). No insert/update/delete RLS policies — every write goes
  through `create_time_off_request()` / `review_time_off_request()` below,
  which is what makes "owners don't submit requests" and "you can't approve
  your own request" real guarantees instead of UI conventions.
- **returns** — failed/returned deliveries, linked back to a stop/route.
- **availability** — per-driver, per-day shift/time-off calendar.
- **notifications** — targeted at `target_user_id` OR broadcast to
  `target_roles` (an `app_role[]`).
- **help_articles** — Help/Wiki content, optionally scoped to `roles`.
- **org_settings** — single-row table for company name/timezone, plus the
  delivery config (`require_photo_for_in_hand`,
  `leave_location_options text[]`).

`route_stops` also carries the driver delivery workflow's configuration and
proof: `delivery_method`, `delivery_pin` (see below), `recipient_name`,
`delivery_signature_data`, `delivery_photo_data`, `delivery_leave_location`.
`packages` carries `scanned_at`.

## Row-Level Security

Every table has RLS enabled. Helper functions (`security definer`):

- `current_role_name()` — the caller's `profiles.role`.
- `current_driver_id()` — the caller's `drivers.id`, if any.
- `is_manager()` — owner/general_manager.
- `is_ops()` — owner/general_manager/dispatch.
- `is_back_office()` — owner/general_manager/dispatch/staff.

Policy shape, per table:

- `customers`, `drivers`, `availability`, `help_articles`, `org_settings` —
  broad read for authenticated users (needed across the app for names/
  addresses/labels); writes gated by the helper functions above.
- `routes` / `route_stops` — back-office roles see everything; a driver only
  sees rows where the route's `driver_id` matches `current_driver_id()`, and
  can update only their own stops' status.
- `returns` — back-office roles see/manage everything; a driver sees and can
  create only their own.
- `notifications` — visible if `target_user_id = auth.uid()` or the row is a
  broadcast whose `target_roles` includes the caller's role.
- `packages` — same visibility split as `route_stops` (back-office roles see
  everything, a driver sees only their own route's packages), but writes go
  exclusively through the `increment_package_print()` RPC (below) — there is
  no general-purpose update policy for print bookkeeping.
- `time_off_requests` — a requester sees their own; owner/general_manager/
  dispatch see all (they're the approvers). No direct writes at all.
- `availability` — a driver may insert/update/delete only their *own* rows,
  and only while the row's status is `available` or `partial`; touching or
  setting `unavailable`/`time_off` directly is blocked by RLS — that status
  only ever gets set by `review_time_off_request()` approving a request.
- `route_stops.delivery_pin` has **no SELECT grant for `authenticated` or
  `anon`** (`revoke select (delivery_pin) on route_stops from authenticated,
  anon`) — real column-level security, not just an app convention. Every
  client-side query against `route_stops` lists its columns explicitly
  (`STOP_COLUMNS` in `src/hooks/useRoutes.ts`) rather than using `*`, so it
  never even asks for that column. The only legitimate readers are
  `get_delivery_pin()` (back office) and `complete_delivery()` (compares it
  internally) — both `security definer`.

## Route confirmation integrity

Two extra safeguards enforce "every label must be printed before a route is
confirmed" at the database level, not just in the UI:

- `increment_package_print(p_package_id uuid)` — a `security definer` RPC
  that is the *only* way a package's `label_printed`/`printed_at`/
  `print_count` change. It updates the existing row in place, so printing
  and reprinting are the same idempotent operation and can never create a
  duplicate package.
- `routes_check_labels_before_confirm` — a `before update` trigger on
  `routes` that raises an exception if a route is moved out of `draft`
  while any of its packages still has `label_printed = false`.

## Route reassignment

`reassign_route_driver(p_route_id, p_new_driver_id, p_reason, p_notes)` is
the *only* path that ever changes `routes.driver_id` — used for both the
first assignment after confirming a route and reassigning a confirmed or
active route (driver called in sick, abandoned the route, another driver
takes over, etc). Restricted to `is_ops()` (owner/general_manager/
dispatch). In one transaction it: locks the route row, flips `driver_id`,
writes one row to `route_assignment_history`, and notifies the outgoing and
incoming driver. It never touches `route_stops` or `packages` — scanned
packages, delivery history, and progress carry over untouched, and no new
route or duplicate package is ever created.

## Time off requests

- `create_time_off_request(p_start_date, p_end_date, p_reason)` — any
  authenticated non-owner can call this for themselves. Inserts the request
  and a broadcast notification to dispatch/general_manager/owner.
- `review_time_off_request(p_request_id, p_approve, p_review_note)` —
  restricted to `is_ops()`. Refuses if the caller is the requester (an
  employee cannot approve their own request) or the request was already
  decided. On approval, if the requester has a `drivers` row, it upserts an
  `availability` row of `status = 'time_off'` for every date in the range —
  this is the *only* way `time_off` gets set from a request, and it never
  touches `route_stops`/`packages`. Either way, the requester is notified.

## Driver delivery workflow

- `scan_package(p_package_id, p_qr_payload)` — restricted to the package's
  route's assigned driver. Stamps `packages.scanned_at` only if
  `p_qr_payload` matches the package's own `qr_payload` exactly.
- `complete_delivery(p_stop_id, p_entered_pin, p_recipient_name,
  p_signature_data, p_photo_data, p_leave_location)` — restricted to the
  stop's route's assigned driver. Re-validates everything server-side
  regardless of what the UI already checked: every package for the stop
  has `scanned_at` set, and the proof matches the stop's `delivery_method`
  (`pin_required` compares `p_entered_pin` to the stored `delivery_pin`;
  `signature_required` needs a name + signature; `leave_at_location` needs
  a photo + location; `in_hand` needs a photo only if
  `org_settings.require_photo_for_in_hand` is on). Only then does it set
  `status = 'delivered'`.
- `get_delivery_pin(p_stop_id)` — restricted to `is_back_office()` (never a
  driver), so whoever created the delivery can relay the PIN to the
  recipient without the driver ever seeing it.
- `delivery_pin` is generated client-side (`generateDeliveryPin()` in
  `src/hooks/usePackages.ts`) at the same time as the delivery/packages are
  created, by whoever is creating it (dispatch/staff/managers) — never by
  the driver, and never regenerated afterwards.

## Demo accounts

Seeded directly into `auth.users` + `auth.identities` (password `Demo1234!`
for all, hashed with `pgcrypto`): `owner@medroute.demo`,
`gm@medroute.demo`, `dispatch@medroute.demo`, `staff@medroute.demo`,
`driver1@medroute.demo`, `driver2@medroute.demo`, `driver3@medroute.demo`.
