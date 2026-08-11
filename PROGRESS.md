# BillVolt Admin Portal — Progress & Status

Living document tracking what has been built, what works, and what is still
missing. Kept in sync with `README.md`, `API_REFERENCE.md`, and
`QA_CHECKLIST.md`.

**Overall status:** Modules 1–4 feature-complete. Full responsive pass over every
page is done. Known gaps are listed under [Missing / not yet built](#missing--not-yet-built).

---

## What's done

### Auth, roles & users
- [x] Cookie-based JWT auth with automatic access-token refresh (`frontend/src/api/client.ts`)
  and login rate limiting (10 attempts / 15 min).
- [x] Two roles: `admin` and `staff`. Admin-only areas guarded both in the
  frontend routes (`ProtectedRoute allowedRoles`) and backend middleware.
- [x] User management (`/users`, admin): create, change role, enable/disable,
  delete. Current user cannot be deleted or demoted.
- [x] Login page fully rebuilt: flat ink brand panel (no gradients), demo-account
  quick-fill buttons, single-column stacked layout on tablet/phone, compact mode
  for short desktop windows.
- [x] Seeded demo accounts: `admin@billvolt.com` / `Admin@12345` and
  `sarah.mitchell@billvolt.com` / `Staff@12345`.

### Dashboard (`/dashboard`)
- [x] KPI cards: active practices, providers, approvals this month, pending
  credentialing, open follow-ups — each links to its page.
- [x] Credentialing pipeline chart (by status), 6-month activity trend
  (created vs. approved), top payers by volume, follow-up queue
  (overdue / due today / upcoming). Pure CSS — no chart library.
- [x] Quick links to Reports and AI Assistant.

### Practices (`/practices`, `/practices/:id`)
- [x] Full CRUD with search (name, DBA, NPI, tax ID) and status filtering.
- [x] Practice workspace tabs: practice info, providers, payer grid, and a
  placeholder for the upcoming document repository.

### Providers (`/providers`, `/providers/:id`)
- [x] CRUD with search (name, NPI, specialty) and status filtering.
- [x] Licenses, DEA registrations, CAQH account info.
- [x] Encrypted at-rest fields (SSN, CAQH credentials) exposed only through an
  admin-only, audit-logged sensitive-data endpoint. SSN/caqh are never returned
  by the normal provider endpoints.
- [x] Provider workspace tabs: overview, payer records, sensitive data (admin only).

### Credentialing grid (`/credentialing`)
- [x] One record per provider × payer with inline status editing across six
  statuses (`not_started → in_progress → submitted → approved / denied / expired`).
- [x] `nextFollowUpDate` auto-creates (or reschedules) a linked follow-up.
- [x] Per-record timeline: unlimited chronological log of calls, emails, notes.
- [x] Inline badge-style status `<select>` (`.status-select` class).

### Follow-ups (`/follow-ups`)
- [x] Buckets for overdue / due today / upcoming with live counts.
- [x] Priority colors, overdue-day tracking, one-click complete.
- [x] Notification bell in the top bar surfaces today's + overdue follow-ups.

### Reports (`/reports`)
- [x] Practice/provider totals, credentialing-by-status bars, top payers.

### AI Assistant (`/ai-assistant`)
- [x] Pattern-matching answers against real portal data — no external LLM/API
  key. Ambiguous matches ask for clarification; queries are audit-logged.
- [x] Suggestion chips + thinking indicator in the chat UI.

### Settings (`/settings`, admin)
- [x] Org name, timezone, contact email, session timeout, overdue follow-up
  notification toggle. Read-only for staff.

### Audit log (`/audit-log`, admin) — Phase 5
- [x] Admin screen browsing every `AuditLog` entry: filter by action, resource
  type, and date range, with pagination (`.table-scroll` table, `MetaPreview`
  shows metadata inline).
- [x] Backend `GET /api/audit-logs` (admin-only), newest-first, `userId` populated
  to name/email, Zod-free simple query params, pagination cap at 200.

### Report export (CSV) — Phase 5
- [x] `GET /api/reports/export` returns a four-section CSV: summary counts,
  practices, providers, credentialing records (properly escaped cells,
  attachment filename + `text/csv`).
- [x] Reports page "Export CSV" button downloads via blob from `apiClient` with
  loading + error toast.

### Follow-up notifications (nodemailer) — Phase 5
- [x] `backend/src/services/mailer.service.js` — SMTP via nodemailer, configured
  from `SMTP_HOST/PORT/SECURE/USER/PASS/FROM` + `EMAIL_ENABLED`. **If SMTP isn't
  configured, emails are logged to the console** — the app keeps working locally
  with zero config.
- [x] `backend/src/services/followUpNotify.service.js` — digest of pending
  overdue / due-today follow-ups, grouped per assigned user email (falls back to
  org `contactEmail`), respects `notifyOnOverdueFollowUps`.
- [x] Hooked into follow-up create/update; manual admin re-send via
  `POST /api/followups/notify` (audit-logged).
- [x] `nodemailer` dependency installed; `backend/.env.example` documents the
  SMTP_* vars.

### Per-practice user assignment (FR-001) — Phase 6
- [x] `User.assignedPracticeIds` — staff see only assigned practices; admins
  unrestricted (empty assignment = empty lists, not everything).
- [x] Scoping applied everywhere: `/practices`, `/providers` (+`/sensitive`),
  `/credentialing`, `/timeline`, `/followups`, `/dashboard/summary`,
  `/reports/summary` + `/export`, and the AI assistant
  (`applyPermissionFilter` now real, not a stub).
- [x] Write access is scoped too: staff can't create/edit records in practices
  they aren't assigned to; creating a practice auto-assigns it to the creator.
- [x] Admin UI: User management rows get a practice-assignment picker;
  Add-user modal has the same for new staff.
- [x] Assignment changes are audit logged (`PATCH /api/users/:id`).
- [x] Seed data distributes the 5 practices across the 3 demo staff.

### Responsive layout (full pass)
- [x] Sidebar collapses into a mobile drawer ≤900px with backdrop + hamburger.
- [x] Every page audited and responsive: login, dashboard, reports, follow-ups,
  practices, providers, credentialing grid, users, settings, AI assistant, both
  workspaces, and all 4 form modals.
- [x] Toolbars wrap; tables scroll horizontally (`.table-scroll`); modals never
  exceed viewport (`maxWidth: 100%`, `maxHeight: 90vh`).
- [x] Topbar tightens ≤640px and hides name/role text ≤480px; notification
  dropdown width clamps to viewport; AI chat shell uses `100dvh` on mobile;
  workspace tab bars wrap.

### Backend structure
- [x] Express + Mongoose; routes under `backend/src/routes`, Zod validation in
  `validators`, controllers, services (`credentialingSearch`), crypto util for
  field-level encryption.
- [x] Guardrails on list endpoints: pagination (`page`/`limit`), search/status
  filters, input sanitation.
- [x] Security: bcrypt password hashing, helmet, CORS (configured origin),
  rate limiting, audit log for sensitive access and record changes.
- [x] Health check: `GET /api/health` (reports DB + Redis status; Redis optional).

### Seed data
- [x] `backend/src/scripts/seedDemo.js` — 5 practices, 16 providers,
  73 credentialing records, 42 follow-ups, 209 timeline entries, staff users,
  org settings. Loaded into local MongoDB (localhost:27017). Staff users get
  practice assignments (practices are distributed round-robin across the 3
  demo staff; existing users keep theirs).
- [x] `backend/src/scripts/seedAdmin.js` — create/reset the admin account; safe
  to re-run.

### Tests
- [x] Jest + Supertest + `mongodb-memory-server` (no real DB/Redis needed):
  `backend/tests/auth.test.js`, `practice.test.js`, `rbac.test.js`,
  `scoping.test.js` (24 tests across 4 suites).
- [x] Coverage: wrong-password/unknown-email rejection, cookie-session login,
  token refresh rotation, logout, practice CRUD + validation + search, staff
  blocked from delete/users/sensitive (403), NoSQL injection attempt, all
  protected routes reject unauthenticated requests (401), and FR-001 scoping
  (staff lists/dashboard/reports filtered to assigned practices, 403 on
  unassigned detail/write, admins unaffected).
- [x] NOTE: no frontend automated tests — frontend QA is the manual checklist in
  `QA_CHECKLIST.md`.

---

## Missing / not yet built

| Item | Status | Notes |
|---|---|---|
| Per-practice user assignment | Done | FR-001 shipped — staff scoped to `assignedPracticeIds` everywhere (see above). |
| Document repository (file upload & versioning) | Placeholder only | Practice workspace "Documents" tab is a placeholder; W-9s, licenses, payer contracts not stored. Needs storage scope (S3/GridFS) + upload UI. |
| Archived reports / date-range pickers | Partial | CSV export done (`/api/reports/export` + "Export CSV" button); still no on-screen date-range/archived report picker. |
| Email / SMS follow-up notifications | Email done | Nodemailer digest for overdue/due-today (console fallback when unconfigured); SMS transport still not built. |
| Session timeout enforcement | Policy only | `sessionTimeoutMinutes` is displayed but not wired to session expiry. |
| Frontend automated tests | Not built | No Vitest/Testing Library setup. |
| Paginated "load more" UX | N/A | Backend paginates; list pages currently fetch with large `limit` and render all. |
| Audit log UI | Done | Admin screen at `/audit-log` with filters + pagination (see above). |

---

## Know-how / gotchas (important)

- **`npm run seed:demo -- --reset` does not pass `--reset`** — npm swallows extra
  args. Run `node src/scripts/seedDemo.js --reset` instead.
- **Mongoose quirk:** `create()` preserves an explicitly-passed `createdAt`;
  model `updateOne` drops `createdAt` but applies `updatedAt`. The seed script was
  written around this behavior (timeline dates that span a trend window).
- **No external LLM:** the AI Assistant is deterministic pattern-matching; it has
  no API key and works fully offline against portal data.

---

## Commands

```bash
# Backend
cd backend
npm run dev          # http://localhost:5000
npm start            # production mode
npm run seed:admin   # create/reset admin account
npm test             # Jest suite (in-memory Mongo)

# Demo data (run inside backend/ — NOT via npm run seed:demo if you need flags)
node src/scripts/seedDemo.js            # merge seed into local DB
node src/scripts/seedDemo.js --reset    # wipe + reseed local DB

# Frontend
cd frontend
npm run dev           # http://localhost:5173
npm run build         # tsc -b + vite build
npm run preview
```

---

## Suggested next work (prioritized)

1. **Document repository** — pick storage (S3 or GridFS), build upload/list UI in
   the Practice workspace, wire to backend.
2. **Session timeout enforcement** — apply the configured minutes to access-token
   lifetime / idle check.
3. **Reports date-range / archived picker** — on-screen filter + per-period CSV
   on top of the existing export.
4. **SMS notifications** — transport behind the existing follow-up setting
   (email digest already built).
5. **Frontend test setup** — Vitest + React Testing Library smoke tests.