# BillVolt Admin Portal

**Run your credentialing operation without spreadsheets.**

BillVolt is a full-stack admin portal for **medical billing companies,
credentialing services, and healthcare practices** that need to track provider
enrollments, payer applications, and follow-ups in one place — instead of piles
of Excel sheets, emails, shared drives, and sticky notes.

## Who it's for

- **Medical billing companies** juggling credentialing across many practices and
  payers.
- **Credentialing & contracting firms** that enroll providers for their clients.
- **Practice administrators** who approve providers and keep credentials current.
- **Revenue-cycle & operations teams** that need one source of truth for
  provider-payer status.

## What it replaces

| Instead of… | BillVolt gives you… |
|---|---|
| Excel spreadsheets shared over email | A centralized credentialing grid with one record per provider × payer |
| Sticky notes and memory for follow-ups | Automatic follow-up tasks whenever a credentialing record needs attention |
| Scattered emails and phone notes | A per-record timeline logging every call, email, and status change |
| Manual status tracking | One-click status updates (not started → submitted → approved / denied) |
| Rebuilding the same reports each week | Live dashboards, pipeline charts, and report summaries |

Whether you credential for one practice or dozens of payers across multiple
states, BillVolt keeps every provider, payer, and follow-up current and auditable
— no spreadsheets required.

**Status:** Modules 1–4 feature-complete. See [Roadmap](#roadmap).

---

## Table of contents

- [Who it's for](#who-its-for)
- [What it replaces](#what-it-replaces)
- [Features](#features)
- [Example use cases](#example-use-cases)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Data models](#data-models)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [API overview](#api-overview)
- [AI Assistant](#ai-assistant)
- [Security](#security)
- [Testing](#testing)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Features

**Dashboard** (`/dashboard`)
- KPI cards: active practices, providers, approvals this month, pending
  credentialing, and open follow-ups — each links to the underlying page.
- Credentialing pipeline chart (by status), 6-month activity trend
  (created vs. approved), top payers by volume, and a follow-up queue
  (overdue / due today / upcoming). All charts render with pure CSS — no chart
  library dependency.
- Quick links to Reports and the AI Assistant.

**Auth & users**
- Cookie-based JWT auth with automatic access-token refresh
  (`frontend/src/api/client.ts`) and login rate limiting.
- Role-based access: `admin` and `staff`. User management (create, change role,
  enable/disable, delete) is admin-only; staff never see admin menu items.

**Practices** (`/practices`)
- Full CRUD with search (name, DBA, NPI, tax ID) and status filtering.
- Practice workspace with tabs: practice info, providers, payer grid, and a
  placeholder for the upcoming document repository.

**Providers** (`/providers`)
- CRUD with search (name, NPI, specialty) and status filtering.
- Licenses, DEA registrations, CAQH account info, and encrypted at-rest fields
  (SSN), exposed only via an admin-only, audit-logged sensitive-data endpoint.

**Credentialing grid** (`/credentialing`)
- One record per provider × payer, with inline status editing across six statuses
  (`not_started → in_progress → submitted → approved / denied / expired`).
- `nextFollowUpDate` auto-creates (or reschedules) a linked follow-up.

**Timeline**
- Unlimited chronological log per credentialing record (calls, emails, notes).

**Follow-ups** (`/follow-ups`)
- Buckets for overdue / due today / upcoming with live counts, priority colors,
  one-click complete, and overdue-day tracking.

**Reports** (`/reports`)
- Practice/provider totals, credentialing-by-status bars, and top payers.
- "Export CSV" button downloads the full report (summary counts, practices,
  providers, credentialing records) from `GET /api/reports/export`.

**AI Assistant** (`/ai-assistant`)
- Pattern-matching answers against real portal data (see [AI Assistant](#ai-assistant)).

**Audit log** (`/audit-log`, admin)
- Filterable, paginated history of record changes, sensitive-data reveals,
  settings updates, and notification sends — who, what, when, and from which IP.

**Settings** (`/settings`, admin)
- Org name, timezone, contact email, session timeout, and overdue follow-up
  notifications. Configuration is read-only for staff.

## Notifications

- A bell in the top bar surfaces today's follow-ups.
- Follow-up due-date digests: when a follow-up is created/updated to be due
  today or overdue (and the "notify on overdue follow-ups" setting is on), a
  digest email is sent to the assigned user (falling back to the org contact
  email). SMTP is configured via env vars; **if not configured, the digest is
  logged to the console instead**, so it works locally with zero setup. Admins
  can re-send via `POST /api/followups/notify`.

---

## Example use cases

- **Billing company onboarding a new practice** — add the practice and its
  providers, then enroll every provider against the practice's payers in the
  credentialing grid. The grid shows exactly what's pending and what's approved.
- **Credentialing coordinator chasing a payer** — open a provider's credentialing
  record, see its status and next follow-up date, log the call in the timeline,
  and reschedule the follow-up — all in one screen.
- **Practice manager approving a new clinician** — review the provider's license,
  DEA, and CAQH details, then hand off to credentialing with full audit history.
- **Owner checking weekly progress** — the dashboard shows approvals this month,
  pending credentialing, and overdue follow-ups at a glance; Reports breaks it
  down by practice, payer, and status.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, React Router, Lucide icons |
| Backend | Node.js, Express, MongoDB with Mongoose, JWT auth, Zod validation |
| Caching/sessions | Redis (ioredis) — optional, powers early refresh-token revocation |
| Security | Helmet, CORS, express-rate-limit, bcrypt password hashing, field-level encryption |
| Testing | Jest, Supertest, mongodb-memory-server (no real DB/Redis needed) |
| Tooling | GitHub, Postman, Vercel (frontend), Render (backend) |

---

## Project structure

```
billvolt-admin-portal/
├── backend/
│   ├── src/
│   │   ├── config/       # DB + Redis connections
│   │   ├── controllers/  # Route handler logic (auth, users, practices, …)
│   │   ├── middleware/   # JWT protect, admin guard, input sanitization
│   │   ├── models/       # Mongoose schemas (User, Practice, Provider, …)
│   │   ├── routes/       # Express routers, one per resource
│   │   ├── services/     # Cross-cutting logic (AI search engine, crypto)
│   │   ├── validators/   # Zod request schemas
│   │   ├── scripts/      # seed:admin
│   │   ├── utils/        # crypto.util (encrypt/decrypt helpers)
│   │   ├── app.js        # Express app + middleware + route mounting
│   │   └── server.js     # Entry point
│   └── tests/            # Jest + Supertest suite
├── frontend/
│   ├── public/           # favicon.svg, icons.svg
│   └── src/
│       ├── api/          # Axios client with auto token refresh
│       ├── components/   # Shared UI, form modals, layout (AppShell, Sidebar, Topbar)
│       ├── constants/    # Shared display constants (credentialing statuses)
│       ├── context/      # Auth + toast context
│       ├── pages/        # One file per route
│       ├── routes/       # ProtectedRoute
│       └── types/        # Shared TypeScript types
├── render.yaml           # Render blueprint for the backend
├── frontend/vercel.json  # SPA rewrite for Vercel
├── README.md             # You are here
├── API_REFERENCE.md      # Every endpoint, method, and access level
├── SECURITY.md           # Audit findings + hardening notes
├── DEPLOYMENT.md         # Render + Vercel deployment steps
├── QA_CHECKLIST.md       # Automated coverage + manual walkthrough
└── PRESENTATION.md       # Project summary and engineering decisions
```

---

## Data models

- **User** — staff/admin accounts with role-based access.
- **Practice** — medical practices/clinics; identifiers, contacts, multiple
  service locations, owner, and status.
- **Provider** — clinician records linked to a practice; licenses, DEA
  registrations, and CAQH credentials (encrypted at rest).
- **CredentialingRecord** — provider × payer credentialing status with
  `nextFollowUpDate` that drives automatic follow-up creation.
- **TimelineEntry** — chronological activity log per credentialing record.
- **FollowUp** — tasks/reminders linked to a CredentialingRecord or Provider.
- **OrgSettings** — single org-wide settings row, created lazily.
- **AuditLog** — tracks sensitive-data access and record changes.

---

## Getting started

### Prerequisites

- Node.js **≥ 18** (and npm)
- MongoDB (local, Atlas, or `mongodb-memory-server` for tests)
- Optional: a Redis instance (Upstash or local) for early session revocation

### Backend

```bash
cd backend
cp .env.example .env      # then fill in secrets (see below)
npm install
npm run dev               # http://localhost:5000
```

Create your first admin account:

```bash
npm run seed:admin
```

Default credentials are `admin@billvolt.com` / `Admin@12345` unless
`ADMIN_EMAIL` / `ADMIN_PASSWORD` are set in `.env`. The script is safe to
re-run — it just resets the admin password.

Health check: `GET http://localhost:5000/api/health` (reports DB + Redis status).

### Frontend

```bash
cd frontend
cp .env.example .env      # VITE_API_URL defaults to http://localhost:5000/api
npm install
npm run dev               # http://localhost:5173
```

Sign in at `http://localhost:5173` with the seeded admin account.

### Running tests

```bash
cd backend
npm test
```

Runs against an in-memory MongoDB — no real database or Redis required. See
`QA_CHECKLIST.md` for full coverage and the manual walkthrough.

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | no | API port (default `5000`) |
| `NODE_ENV` | no | `development` / `production` |
| `MONGODB_URI` | yes | MongoDB connection string |
| `REDIS_URL` | no | Redis for refresh-token revocation; app runs without it |
| `JWT_SECRET` | yes | Signs access tokens (long random string) |
| `JWT_REFRESH_SECRET` | yes | Signs refresh tokens (different string) |
| `FIELD_ENCRYPTION_KEY` | yes | Encrypts SSN / CAQH credentials at rest |
| `CLIENT_URL` | no | Frontend origin for CORS (default `http://localhost:5173`) |
| `EMAIL_ENABLED` / `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | no | Follow-up notification emails. If `EMAIL_ENABLED` isn't `true` or SMTP credentials are missing, emails are logged to the console instead of sent — the app keeps working with zero config. |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | no | Used only by `npm run seed:admin` |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | no | API base URL (default `http://localhost:5000/api`) |

---

## Available scripts

### Backend (`cd backend`)

| Script | Description |
|---|---|
| `npm run dev` | Start with nodemon (auto-restart) |
| `npm start` | Start in production mode |
| `npm run seed:admin` | Create/reset the admin account |
| `npm test` | Run the Jest + Supertest suite |

### Frontend (`cd frontend`)

| Script | Description |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) + production build |
| `npm run preview` | Preview the production build |

---

## API overview

Base URL: `http://localhost:5000/api` (dev). Auth is cookie-based and automatic
once logged in. The full endpoint reference is in [`API_REFERENCE.md`](API_REFERENCE.md).

| Resource | Endpoint(s) | Access |
|---|---|---|
| Auth | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/register` | public / authenticated / admin |
| Users | `GET/POST /users`, `PATCH/DELETE /users/:id` | admin |
| Practices | `GET/POST /practices`, `GET/PATCH/DELETE /practices/:id` | authenticated (delete = admin) |
| Providers | `GET/POST /providers`, `GET/PATCH/DELETE /providers/:id`, `GET /providers/:id/sensitive` | authenticated (delete & sensitive = admin) |
| Credentialing | `GET/POST /credentialing`, `GET/PATCH/DELETE /credentialing/:id` | authenticated (delete = admin) |
| Timeline | `GET/POST /timeline`, `DELETE /timeline/:id` | authenticated (delete = admin) |
| Follow-ups | `GET /followups`, `GET /followups/counts`, `GET/POST /followups`, `POST /followups/notify` (admin), `PATCH/DELETE /followups/:id` | authenticated (delete & notify = admin) |
| Audit log | `GET /audit-logs` | admin |
| Dashboard | `GET /dashboard/summary` | authenticated |
| Reports | `GET /reports/summary`, `GET /reports/export` (CSV) | authenticated |
| AI Assistant | `POST /ai/query` | authenticated |
| Settings | `GET /settings`, `PATCH /settings` | authenticated (patch = admin) |
| Health | `GET /health` | public |

Guardrails on every list endpoint: pagination (`page` / `limit`), search and
status filters, and sanitized inputs.

---

## AI Assistant

`POST /api/ai/query` accepts `{ "question": "…" }` and returns a natural-language
answer by pattern-matching against **real portal data** — no external LLM or API
key required. It handles questions such as:

- "What is the credentialing status for Dr. Smith at Aetna?"
- "Which payers are still pending for [practice name]?"
- "What follow-ups are due today?"

Ambiguous matches ask for clarification rather than guessing, and every query is
written to the audit log. See the provider details panel and the
`credentialingSearch.service.js` for the matching logic.

---

## Security

- Passwords hashed with bcrypt; JWTs are cookie-borne and rotated.
- Login is rate-limited (10 attempts / 15 min); API is rate-limited per IP.
- Sensitive provider fields (SSN, CAQH credentials) are encrypted at rest and
  exposed only through an admin-only, audit-logged endpoint.
- Input sanitization middleware strips dangerous payloads on every request.
- Helmet hardening and CORS restricted to the configured frontend origin.
- Full audit findings and remaining known gaps in [`SECURITY.md`](SECURITY.md).

---

## Testing

Backend tests cover auth, account creation, practice management, and
role-based access control against `mongodb-memory-server`:

```bash
cd backend
npm test
```

The manual browser QA walkthrough (mobile responsiveness, notification
interactions, sensitive-field exposure, and more) lives in
[`QA_CHECKLIST.md`](QA_CHECKLIST.md).

---

## Deployment

Production is split across Render (backend) and Vercel (frontend):

- Backend on Render using the included `render.yaml` blueprint, with
  health-check monitoring and the required environment variables.
- Frontend on Vercel with `vercel.json` rewrite rules so deep links survive
  page refreshes, and `VITE_API_URL` pointed at the deployed backend.
- After first deploy, point CORS (`CLIENT_URL`) at the Vercel URL and seed the
  admin account with production credentials.

Step-by-step instructions: [`DEPLOYMENT.md`](DEPLOYMENT.md).

---

## Documentation

| File | Contents |
|---|---|
| `README.md` | Orientation, quick start, architecture (this file) |
| `API_REFERENCE.md` | Every endpoint, method, and access level |
| `SECURITY.md` | Security audit findings and hardening notes |
| `DEPLOYMENT.md` | Render + Vercel deployment walkthrough |
| `QA_CHECKLIST.md` | Automated test coverage + manual QA walkthrough |
| `PRESENTATION.md` | Project summary, key decisions, and known limitations |
| `PROGRESS.md` | What's built, what's missing, commands, and gotchas |
| `FEATURE_PLAN.md` | Phase 5 feature specs (audit log, CSV export, notifications) |

---

## Roadmap

| Module | Focus | Status |
|--------|-------|--------|
| 1 | Project setup, auth, dashboard UI, user management, responsive layout | ✅ Done |
| 2 | Practices, Providers, Credentialing Grid, CRUD, search/filtering | ✅ Done |
| 3 | Follow-ups, Timeline, Reports, AI Assistant, notifications, dashboard charts | ✅ Done |
| 4 | Settings, security audit, testing, deployment config, docs | ✅ Done |
| 5 | Audit log admin screen, report CSV export, follow-up email notifications | ✅ Done |

Deferred (documented in `PRESENTATION.md`): per-document file storage, archived
reports with date-range pickers, and SMS follow-up notifications (the email
digest is live — see [Notifications](#notifications)).

---

## Contributing

1. Fork the repository and create a feature branch.
2. Keep backend changes covered by the Jest suite; run `npm test` before pushing.
3. For frontend work, run `npm run build` to type-check before opening a PR.
4. Update `API_REFERENCE.md` when adding or changing endpoints.

---

## License

Proprietary — internal tooling for BillVolt. Not licensed for external use or
redistribution.