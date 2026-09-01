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

## Reassigning a route

Dispatch, General Managers, and Owners can reassign a **confirmed or
active** route to a different driver at any time — a driver calling in
sick, going unavailable, leaving early, abandoning the route, or another
driver simply taking over. Open the route → "Reassign Driver", pick the new
driver and a reason. The new driver takes over exactly where the route
stands: scanned packages, completed deliveries, and all progress carry over
untouched — nothing is reset, no duplicate package or route is ever
created. Every change (previous driver, new driver, who made it, when, and
the route's status at the time) is recorded in the route's Assignment
History, enforced at the database level by a dedicated
`reassign_route_driver()` function rather than a plain client-side update.

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
