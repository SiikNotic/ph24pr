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
- **returns** — failed/returned deliveries, linked back to a stop/route.
- **availability** — per-driver, per-day shift/time-off calendar.
- **notifications** — targeted at `target_user_id` OR broadcast to
  `target_roles` (an `app_role[]`).
- **help_articles** — Help/Wiki content, optionally scoped to `roles`.
- **org_settings** — single-row table for company name/timezone.

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

## Demo accounts

Seeded directly into `auth.users` + `auth.identities` (password `Demo1234!`
for all, hashed with `pgcrypto`): `owner@medroute.demo`,
`gm@medroute.demo`, `dispatch@medroute.demo`, `staff@medroute.demo`,
`driver1@medroute.demo`, `driver2@medroute.demo`, `driver3@medroute.demo`.
