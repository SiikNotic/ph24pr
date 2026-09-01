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
