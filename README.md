# MedRoute — Pharmacy & Medical Delivery Management

A role-based delivery management system for pharmacies and medical courier
operations: plan routes, dispatch drivers, track deliveries and returns,
manage customer/facility records, and keep everyone — from ownership to
drivers in the field — working from the same real-time data.

## Stack

- **React 19 + TypeScript + Vite**
- **Tailwind CSS v4** + hand-built shadcn/ui-style primitives (Radix UI)
- **Supabase** — Postgres, Auth, and row-level security as the backend
- **TanStack Query** for data fetching/caching, **Zustand** for client state
- **react-i18next** — fully bilingual UI (English / Spanish)
- **Recharts** for reporting

## Route creation workflow

Creating a route is a guided, three-step process (Routes → New Route):

1. **Deliveries** — name the route (e.g. "Route 1", "Pharmacy Route"), then
   add a delivery per customer, picking an existing one or creating a new
   customer record inline. Each delivery mints one uniquely identified,
   QR-coded package per unit, generated once and never re-created.
2. **Print Labels** — every package's label must be printed before moving
   on. If a print fails or a label is damaged, "Reprint Label" reprints the
   exact same package code/QR — it never creates a duplicate package or
   delivery. Enforced both in the UI and by a database trigger.
3. **Confirm & Assign** — once every label is printed, the manager confirms
   the route, then assigns a driver. The driver never has to accept
   anything: as soon as they're assigned, the route shows up in their app.

## Route lifecycle

A route moves through nine statuses, each one only ever set by a validated
database transition — never a plain client-side write:

`Draft → Labels Pending → Labels Printed → Confirmed → Assigned → Active →
Returning to Station → Completed → Closed`

The first three advance automatically as labels get printed. A manager
confirms once every label is printed; assigning a driver for the first time
automatically moves it to Assigned; from there, "Start route", "Returning
to station", and "Complete route" walk it the rest of the way — available
to the assigned driver or dispatch+. Only Owners/General Managers can
"Close route" once it's completed, archiving it for good. Every delivery
(package) has its own parallel lifecycle — Pending → Out for Delivery →
Scanned → Delivered, or Pending Return → Returned for a failed one — kept
in exact step with the driver's actual workflow (scanning still happens at
the door, right before proof of delivery, unchanged from before).

## Audit trail

Every status change, driver reassignment, address correction, label
reprint, delivery completion or failure, and return is permanently
recorded — never overwritten, never deleted. Each entry captures who made
the change, their role, when, the previous state, the new state, and which
route/stop/package/return it belongs to. Open any route to see its full
**Audit Log**, right alongside the route's own Assignment History and each
delivery's Address History (which keep their own focused, dedicated
panels — the Audit Log is the comprehensive, cross-entity feed of
everything).

## Reassigning a route

Dispatch, General Managers, and Owners can reassign a route — from the
moment it's confirmed all the way through to heading back to the station —
to a different driver at any time: a driver calling in sick, going
unavailable, leaving early, abandoning the route, or another driver simply
taking over. Open the route → "Reassign Driver", pick the new driver and a
reason. The new driver takes over exactly where the route stands: scanned
packages, completed deliveries, and all progress carry over untouched —
nothing is reset, no duplicate package or route is ever created. Every
change (previous driver, new driver, who made it, when, and the route's
status at the time) is recorded in the route's Assignment History, enforced
at the database level by a dedicated `reassign_route_driver()` function
rather than a plain client-side update.

## Time off requests

Drivers and Staff request days they can't work from the Availability page
("Juan requested Thursday and Friday off"); Owners never need to. The
request goes to Dispatch or a manager (General Manager, Owner) for approval
— an employee can never approve their own request, enforced by the
database, not just the UI. Rejecting one keeps the calendar untouched and
tells the employee why; approving a driver's request writes those exact
dates onto their availability calendar as time off automatically. Wherever
a driver is picked for a route (assigning or reassigning), anyone marked
unavailable for that date shows a clear warning right in the driver list —
management can still pick them if operationally necessary, but never
without seeing it first. Owners, General Managers, and Dispatch can still
edit any driver's calendar directly for anything the request flow doesn't
cover; a driver's own direct edits are limited to setting their working
hours (available/partial) — going unavailable always goes through a
request.

## Driver delivery workflow

Every delivery has to be scanned before it can be completed — a driver
opens a stop and scans each of its packages (photographs the QR label,
decoded on-device, or types the printed code by hand if scanning fails)
before anything else unlocks. Once every package is scanned, the app shows
the proof required for that delivery's configured method:

- **Delivery In Hand** — just a confirmation, unless the company has turned
  on "require photo for in-hand deliveries" in Settings.
- **Leave at Location** — a photo is mandatory, plus picking where it was
  left from the company's configured list (Settings → Delivery Settings).
- **Signature Required** — recipient name and an on-screen signature.
- **4-Digit PIN Required** — a PIN generated only for that delivery when it
  was created; the driver never sees it, only whoever created the delivery
  does (to relay it to the recipient) via "Reveal PIN" on the route. The
  driver has to get the right one from the recipient.

The database re-validates all of this itself in `complete_delivery()` —
every rule (scanned first, the right proof, the correct PIN) holds even if
something calls the API directly, not just through this UI. Completing a
delivery automatically moves the driver on to their next pending stop.

## Failed-delivery handling

When a delivery can't be completed, "Report issue" walks the driver through
it instead of just leaving the stop stuck. **Customer Does Not Respond** is
its own guided flow: the driver can call or message the customer right from
the dialog, then starts a countdown for however long the company has
configured (Settings → Delivery Settings — 1/3/5 minutes or a custom
duration); the "Mark as Pending Return" button stays disabled until that
timer actually runs out, enforced by the database itself in
`report_delivery_failure()`, not just by graying out a button. Every other
reason — customer rejected the package, package damaged, wrong address,
can't access the property, or one of the company's own configured "other"
reasons — reports immediately.

Either way the outcome is **Pending Return**, deliberately distinct from
**Returned**: Pending Return means the driver still has the package in hand;
Returned means it has physically come back to the station and dispatch has
logged that hand-back via "Mark as Returned" on the Returns page. Only a
Returned item can go on to be resolved as restocked, disposed, or scheduled
for redelivery — you can't restock something the driver hasn't handed back
yet.

## Incorrect-address handling

A driver who can't find or verify a delivery address selects "Incorrect
Address / Address Not Found" — that's the only thing they can do about it.
Drivers can never officially change a delivery address themselves; it just
raises the issue to Dispatch (a badge shows on the stop either way, so
everyone can see it's been flagged). From there, Dispatch (or anyone above)
contacts the customer, verifies the correct location, and — when
authorized — updates the delivery point right on the stop, with a required
reason for the change. The moment that happens, the driver's route and
navigation link update automatically (their app polls while a delivery is
in progress, so no manual refresh is needed) — no new order or package is
ever created, and nothing about the stop's progress is reset. The original
address is never lost: every change (previous address, new address, who
made it, when, and why) is kept in that stop's Address History.

## Getting started

```bash
npm install
cp .env.example .env   # fill in your Supabase project URL + anon key
npm run dev
```

The database schema, RLS policies, and demo data already live in the
Supabase project referenced by `.env`. See `supabase/schema-notes.md` for an
overview of the schema if you need to re-create it elsewhere.

## Demo accounts

The login screen's "Demo access" panel signs in instantly as any role.
Manual credentials (password for all: `Demo1234!`):

| Role | Email |
|---|---|
| Owner | owner@medroute.demo |
| General Manager | gm@medroute.demo |
| Dispatch | dispatch@medroute.demo |
| Staff | staff@medroute.demo |
| Driver | driver1@medroute.demo (also driver2@, driver3@) |

## Roles & permissions

Access is enforced in two layers:

1. **Supabase Row-Level Security** — the real security boundary. A driver's
   Postgres session can only ever see routes/stops/returns/availability tied
   to their own `driver_id`.
2. **Frontend permission matrix** (`src/lib/permissions.ts`) — drives which
   sidebar sections render and which actions (create/edit/delete/assign/
   resolve/export/manage users) are exposed per role, so the UI never even
   offers what a role can't do.

| Section | Owner | General Manager | Dispatch | Staff | Driver |
|---|---|---|---|---|---|
| Dashboard | ✅ full | ✅ full | ✅ | ✅ | ✅ (own) |
| Routes | ✅ CRUD/assign | ✅ CRUD/assign | ✅ CRUD/assign | 👁 view | ✅ own stops |
| Customers | ✅ CRUD | ✅ CRUD | ✅ create/edit | ✅ create/edit | — |
| Drivers | ✅ CRUD | ✅ CRUD | 👁 view | 👁 view | — |
| Returns | ✅ full/resolve | ✅ full/resolve | ✅ create/resolve | ✅ create | ✅ own |
| Availability | ✅ manage all | ✅ manage all | 👁 view | 👁 view | ✅ own |
| Notifications | ✅ | ✅ | ✅ | 👁 view | ✅ own |
| Reports | ✅ | ✅ | 👁 view | — | — |
| Settings | ✅ full (users, org, danger zone) | ✅ (no danger zone) | — | — | — |
| Help / Wiki | ✅ | ✅ | ✅ | ✅ | ✅ |

## Layout

- Desktop/tablet: fixed dark sidebar + top bar, optimized for management
  workflows (dense tables, dialogs, multi-column dashboards).
- Driver on mobile: the same app, but with a bottom tab bar for the driver's
  core sections (Dashboard, Routes, Availability, Notifications) and
  mobile-first stop cards with one-tap "Mark Delivered" / "Report Issue"
  actions.
- Fully responsive between the two — nothing role-specific is a separate app.

## Project structure

```
src/
  components/
    ui/          shared primitives (button, card, dialog, sheet, table, …)
    layout/       AppShell, Sidebar, Topbar, DriverBottomNav
    shared/       PageHeader, KpiCard, StatusBadge, NotificationBell, …
    routes/       CreateRouteDialog, RouteDetailSheet
    customers/    CustomerFormDialog
    returns/      CreateReturnDialog
  hooks/          useRoutes, useCustomers, useDrivers, useReturns, …
  lib/            supabase client, permissions matrix, mappers, formatting
  pages/          one file per top-level section
  store/          auth (session/profile/driver) and UI (theme) state
  i18n/           en.json / es.json
  types/          domain model shared by the DB schema and the frontend
```
