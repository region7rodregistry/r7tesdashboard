# NTTC Registry — TESDA Region VII

A modern dashboard for the **National TVET Trainer's Certificate (NTTC)** registry of
TESDA Region VII (Central Visayas), built on **Next.js 16 + shadcn/ui + Framer Motion**
and styled to match the TESDA7-Forms system (Geist UI, TESDA blue, light **and** dark themes).

It replaces the old static-HTML site (kept under [`r7nttc/`](r7nttc/) and
[`backup-pre-nextjs/`](backup-pre-nextjs/) for reference).

---

## ✨ Features

- **Registry page** — a table with exactly the requested columns (Province, Last Name,
  First Name, Middle Name, Extension, Qualification, Certificate Number, Control Number,
  Date Issuance, Validity), a validity status badge, and an **Actions → View** column.
- **Full-record dialog** — every field across tabbed *Personal / NC / TM / NTTC* sections.
- **Statistics page** (`/statistics`) — summary cards + interactive donut charts by
  Province, Validity, Sector, Employment Type, Institution Type, New-vs-Renewal, and
  Qualification, with a validity status filter.
- **Search, province / sector / validity filters, column sorting, pagination, CSV export.**
- **Sync button** — pulls the latest rows from the source **Google Sheet** and
  **overwrites the Supabase table** in one click (via a protected server action).
- **Supabase-first data layer** with an automatic fallback to a bundled snapshot
  (`data/records.json`) so the app runs even before credentials are configured.
- **Light/dark theme** (next-themes), toast feedback (sonner), accessible tables/dialogs.

---

## 🚀 Getting started

```bash
npm install
# .env.local is already prepared — fill in the three Supabase values (see below)
npm run dev                  # http://localhost:3000
```

Without Supabase credentials the dashboard still works — it serves the bundled
snapshot of **290 records** and the Sync button shows as *unavailable*.

---

## 🗄️ Database (Supabase / PostgreSQL)

| File | Purpose |
| --- | --- |
| [`db/schema.sql`](db/schema.sql) | `CREATE TABLE nttc_registry` — all 31 columns + comments + indexes |
| [`db/seed.sql`](db/seed.sql) | Seeds all **290** records. **Idempotent** — it `TRUNCATE`s first, so it can be re-run any time without duplicate-key errors |

**Load into Supabase:** open the SQL Editor, run `schema.sql`, then run `seed.sql`.
(Or via psql: `psql "$SUPABASE_DB_URL" -f db/schema.sql -f db/seed.sql`.)

Every source value is preserved verbatim as `TEXT` for a lossless import; the
spreadsheet's letter columns map to snake_case names (e.g. `AD → nttc_expiration_date`,
`AE → cln_ntc_number`).

---

## 🔑 Environment variables (`.env.local`)

| Variable | Required for | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase reads | `https://<project>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase reads | public/anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Sync** (server-only) | secret — never exposed to the browser |
| `GOOGLE_SHEET_ID` | Sync | defaults to your sheet's ID |
| `GOOGLE_SHEET_GID` | Sync | tab id, defaults to `0` |
| `SYNC_SECRET` | optional | enables the external/cron `POST /api/sync` route |

---

## 🔄 How Sync works

**In-app Sync button →** calls a **server action** ([`app/actions.ts`](app/actions.ts)),
which is protected by Next.js (action id + origin checks) and runs entirely server-side,
so no secret is ever shipped to the browser.

**External / cron callers →** `POST /api/sync` ([route](app/api/sync/route.ts)). This is
**fail-closed**: it refuses unless `SYNC_SECRET` is configured *and* supplied via the
`x-sync-secret` header — so the destructive overwrite is never reachable anonymously.

Both paths share [`lib/sync.ts`](lib/sync.ts), which:

1. Fetches the Google Sheet's CSV export (the sheet must be shared as
   **"Anyone with the link can view"**).
2. **Validates the column layout** (anchor headers) and refuses to write if the sheet
   was reordered — guarding against silent data corruption.
3. Skips the multi-row header + the hundreds of empty template rows, then **upserts**
   every record into `nttc_registry` and **prunes** stale rows beyond the new count —
   so the table is never empty mid-sync.

---

## 🧱 Project structure

```
app/
  layout.tsx              # Geist fonts + ThemeProvider + Toaster
  page.tsx                # Registry page (server → AppShell + RegistryDashboard)
  statistics/page.tsx     # Statistics page
  actions.ts              # syncAction server action (in-app Sync button)
  api/sync/route.ts       # fail-closed REST sync for cron/external
  globals.css             # Tailwind v4 + TESDA-blue oklch tokens (light/dark)
components/
  ui/                     # shadcn primitives (button, dialog, tabs, select, table, …)
  theme/                  # next-themes provider + toggle
  dashboard/              # app-shell, stat-cards, filters, registry-table,
                          # record-dialog, pagination, sync-button, pie-chart, statistics-view
lib/
  columns.ts              # canonical column model (letter ↔ snake_case ↔ label)
  nttc.ts                 # name/date/validity helpers + stats
  stats.ts                # chart aggregations (by province/sector/qualification/…)
  csv.ts                  # CSV parser + sheet→records + header validation
  supabase.ts             # read + admin clients
  data.ts                 # Supabase-first loader with snapshot fallback
  sync.ts                 # shared Google-Sheet → Supabase overwrite
data/records.json         # bundled snapshot (290 records)
db/{schema,seed}.sql      # Supabase schema + idempotent seed
```

---

## 📦 Deployment (Vercel + Supabase)

1. Run `db/schema.sql` + `db/seed.sql` in Supabase.
2. Add the env vars above in the Vercel project settings.
3. Deploy. Pages are `force-dynamic`, so each request reads live Supabase data and a
   Sync is reflected immediately.
