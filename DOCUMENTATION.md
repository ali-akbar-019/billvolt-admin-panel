# BillVolt Admin Portal — Project Documentation

> Live demo: **https://medical-credentialing-portal.vercel.app/**
> Source code: **https://github.com/ali-akbar-019/billvolt-admin-panel**

A full-stack admin portal for medical billing companies, credentialing
services, and healthcare practices. It replaces spreadsheets, sticky notes,
and scattered emails with a single place to track provider enrollments, payer
applications, and follow-ups.

---

## Table of contents

- [What problem it solves](#what-problem-it-solves)
- [Who it is for](#who-it-is-for)
- [Project timeline](#project-timeline)
- [Features by module](#features-by-module)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Data models](#data-models)
- [Authorization and access control](#authorization-and-access-control)
- [Security](#security)
- [API overview](#api-overview)
- [AI Assistant](#ai-assistant)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [Testing](#testing)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Known limitations](#known-limitations)

---

## What problem it solves

Medical credentialing is paperwork-heavy: every provider has to be enrolled
with every payer, each enrollment has its own status, deadlines get missed,
and everything is usually tracked across Excel files shared by email. BillVolt
centralizes that work into one grid so a team always knows what is pending,
what is approved, and what needs a follow-up call today.

| Instead of… | BillVolt gives you… |
|---|---|
| Excel spreadsheets shared over email | A centralized credentialing grid, one record per provider x payer |
| Sticky notes and memory for follow-ups | Automatic follow-up tasks whenever a credentialing record needs attention |
| Scattered emails and phone notes | A per-record timeline logging every call, email, and status change |
| Manual status tracking | One-click status updates (not started, in progress, submitted, approved, denied, expired) |
| Rebuilding the same reports each week | Live dashboards, pipeline charts, and report summaries |

## Who it is for

- Medical billing companies that credential across many practices and payers.
- Credentialing and contracting firms that enroll providers for their clients.
- Practice administrators who approve providers and keep credentials current.
- Revenue-cycle and operations teams that need one source of truth for
  provider-payer status.

---

## Project timeline

Built as a series of modules between **10 July 2026 and 16 August 2026**,
with full production deployment on 16 August 2026:

| Date | Work done |
|---|---|
| 10–16 Jul | **Module 1** — project setup and architecture, JWT auth (httpOnly cookies, refresh rotation, login rate limiting), dashboard UI and design system, user management (backend + frontend), database design, responsive layout |
| 17–23 Jul | **Module 2** — practice model and API, practices frontend, practice workspace, provider model and API (encrypted sensitive fields), providers frontend, credentialing grid, dashboard integration |
| 24–30 Jul | **Module 3** — follow-up model with automatic task creation, follow-ups dashboard, timeline engine, reports module, AI assistant (backend search service + chat frontend), notifications and performance |
| 31 Jul – 6 Aug | **Module 4** — settings module, security audit (NoSQL injection fix), automated test suite, deployment configuration, documentation, final polish |
| 7–9 Aug | UI/UX enhancement — clean white theme, larger type scale, refined spacing/shadows, improved empty states |
| 10–11 Aug | FR-001 per-practice user assignment — scoping everywhere (practices, providers, credentialing, follow-ups, dashboard, reports, AI) + admin UI |
| 12 Aug | Recharts dashboard charts, improved logout flow, scrollbar styling |
| 13–15 Aug | UI polish pass, cleanup, QA checklist walkthrough, deployment config finalization |
| 16 Aug | **Full production deployment** — backend on Render, frontend on Vercel, verified end to end against the live environment |

---

## Features by module

**Module 1 — Foundation (setup, auth, users)**
- Cookie-based JWT auth with automatic access-token refresh and login rate
  limiting (10 attempts / 15 minutes).
- Two roles: `admin` and `staff`. Role checks enforced on the backend, and
  admin-only navigation hidden on the frontend.
- User management (admin only): create accounts, change role, enable/disable,
  delete. A user cannot delete or demote themselves.
- Responsive app shell with a sidebar that collapses into a mobile drawer.

**Module 2 — Core entities (practices, providers, credentialing)**
- Practices: full CRUD, search (name, DBA, NPI, tax ID), status filtering, and
  a practice workspace (info, providers, payer grid, documents placeholder).
- Providers: full CRUD, search (name, NPI, specialty), licenses, DEA
  registrations, CAQH account info. Sensitive fields (SSN, CAQH credentials)
  are encrypted at rest and only exposed through an admin-only, audit-logged
  endpoint.
- Credentialing grid: one record per provider x payer with inline status
  editing across six statuses. Setting a next follow-up date automatically
  creates or reschedules a linked follow-up.

**Module 3 — Workflow (follow-ups, timeline, reports, AI, notifications)**
- Follow-ups: buckets for overdue / due today / upcoming with live counts,
  priority colors, one-click complete, and overdue-day tracking.
- Timeline: unlimited chronological log of calls, emails, and notes per
  credentialing record.
- Reports: practice/provider totals, credentialing-by-status bars, top payers,
  and a one-click CSV export.
- AI Assistant: natural-language answers grounded in real portal data, with no
  external LLM or API key required.
- Notification bell in the top bar surfaces today's and overdue follow-ups.

**Module 4 — Hardening (settings, security, testing, deployment)**
- Org-wide settings (admin-gated): org name, timezone, contact email, session
  timeout, and overdue follow-up notification toggle.
- Security audit that found and fixed a real NoSQL operator-injection risk in
  list-endpoint query params (one global middleware).
- Automated Jest + Supertest suite (24 tests) against an in-memory MongoDB.
- Deployment configs for Render (backend) and Vercel (frontend).

**Module 5 — Admin tooling (audit log, CSV export, email notifications)**
- Audit log admin screen: filter by action, resource type, user, and date
  range, with pagination. Every sensitive reveal, settings change, record
  change, and manual notification send is recorded with who, what, when, and
  the originating IP.
- Full report CSV export from the Reports page.
- Follow-up email digest via nodemailer SMTP. If SMTP is not configured, the
  digest is logged to the console so the app works locally with zero setup.

**Module 6 — Per-practice user assignment (FR-001)**
- Staff accounts carry `assignedPracticeIds`; they only see the practices an
  admin assigns to them, everywhere: practices, providers, credentialing,
  timeline, follow-ups, dashboard, reports, and AI answers. Admins see
  everything. Creating a practice auto-assigns it to its creator, and staff
  cannot create or edit records in unassigned practices.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, React Router, Lucide icons, Recharts |
| Backend | Node.js, Express, MongoDB with Mongoose, JWT auth, Zod validation |
| Caching/sessions | Redis (ioredis, optional) for early refresh-token revocation |
| Security | Helmet, CORS, express-rate-limit, bcrypt password hashing, field-level AES-256-GCM encryption |
| Testing | Jest, Supertest, mongodb-memory-server (no real DB or Redis needed) |
| Deployment | Vercel (frontend), Render (backend) |

---

## Project structure

```
billvolt-admin-portal/
├── backend/
│   ├── src/
│   │   ├── config/       # DB + Redis connections
│   │   ├── controllers/  # Route handler logic (auth, users, practices, ...)
│   │   ├── middleware/   # JWT protect, admin guard, input sanitization
│   │   ├── models/       # Mongoose schemas (User, Practice, Provider, ...)
│   │   ├── routes/       # Express routers, one per resource
│   │   ├── services/     # Cross-cutting logic (AI search, mailer, notifications)
│   │   ├── validators/   # Zod request schemas
│   │   ├── scripts/      # seed:admin and seed:demo
│   │   ├── utils/        # token/session/crypto helpers, practice scoping
│   │   ├── app.js        # Express app + middleware + route mounting
│   │   └── server.js     # Entry point
│   └── tests/            # Jest + Supertest suite (auth, rbac, practice, scoping)
├── frontend/
│   ├── public/           # favicon, icons
│   └── src/
│       ├── api/          # Axios client with automatic token refresh
│       ├── components/   # Shared UI, form modals, layout shell
│       ├── constants/    # Shared display constants (credentialing statuses)
│       ├── context/      # Auth + toast providers
│       ├── hooks/        # Session timeout handling
│       ├── pages/        # One file per route
│       ├── routes/       # ProtectedRoute (role-aware, signs out on forbidden access)
│       └── types/        # Shared TypeScript types
├── render.yaml           # Render blueprint for the backend
├── backend/vercel.json   # Backend function routing on Vercel
├── frontend/vercel.json  # SPA rewrite for Vercel
├── DOCUMENTATION.md      # This file
└── README.md             # Short overview and quick start
```

---

## Data models

- **User** — staff/admin accounts with role-based access and
  `assignedPracticeIds` for per-practice scoping (admins unrestricted).
- **Practice** — medical practices/clinics; identifiers, contacts, service
  locations, owner, and status.
- **Provider** — clinician records linked to a practice; licenses, DEA
  registrations, and CAQH credentials (SSN and CAQH encrypted at rest).
- **CredentialingRecord** — provider x payer credentialing status with a
  `nextFollowUpDate` that drives automatic follow-up creation.
- **TimelineEntry** — chronological activity log per credentialing record.
- **FollowUp** — tasks/reminders linked to a CredentialingRecord or Provider.
- **OrgSettings** — single org-wide settings row, created lazily.
- **AuditLog** — tracks sensitive-data access, record changes, settings
  updates, and notification sends.

---

## Authorization and access control

- **Authentication** — httpOnly cookie JWT (15-minute access token, 7-day
  refresh token). The frontend silently refreshes expired access tokens and
  retries the request (`frontend/src/api/client.ts`).
- **Role checks (backend)** — every route requires `protect` (valid session +
  active account). Destructive or sensitive actions additionally require
  `authorize('admin')`: user management, record deletion, provider sensitive
  data, settings writes, audit log reads, and manual notification sends.
- **Role checks (frontend)** — `ProtectedRoute` with `allowedRoles`. Admin-only
  routes are not just hidden from the sidebar; if a staff user opens an admin
  URL directly, the app signs them out and sends them back to the login page
  instead of showing any part of the page.
- **Per-practice scoping (FR-001)** — staff queries are filtered to their
  `assignedPracticeIds` on every list, detail, and write endpoint (practices,
  providers, credentialing, timeline, follow-ups, dashboard, reports, AI). The
  policy lives in `backend/src/utils/scope.util.js`. A staff user with no
  assignments sees empty lists, not everyone else's data.
- **403 vs 401** — unauthenticated requests get 401; authenticated requests to
  resources outside the caller's role or practice scope get 403.

---

## Security

- Passwords hashed with bcrypt (salt rounds 12); JWTs are cookie-borne and
  rotated on refresh.
- Login rate limited (10 attempts / 15 min) plus a general 300 requests /
  15 min API cap per IP.
- Sensitive provider fields (SSN, CAQH credentials) are encrypted at rest with
  AES-256-GCM using a KDF-derived key, excluded from normal responses
  (`select: false`), and only decrypted through an admin-only, audit-logged
  endpoint.
- Global input sanitization strips any key starting with `$` or containing `.`
  from query strings and bodies before controllers see them, blocking NoSQL
  operator injection.
- Helmet security headers, CORS locked to a single configured origin, and a
  global error handler that never leaks stack traces outside development.
- Startup validation: the server refuses to boot in production if
  `JWT_SECRET`, `JWT_REFRESH_SECRET`, `FIELD_ENCRYPTION_KEY`, or `MONGODB_URI`
  are missing.
- Known gaps: no MFA, no automated dependency vulnerability scanning in CI, no
  HIPAA/SOC 2 readiness review (a compliance exercise, not a code change).

---

## API overview

Base URL: `http://localhost:5000/api` in development. Auth is cookie-based and
automatic once logged in.

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

List endpoints support pagination (`page`, `limit`), search, and status
filters, and sanitize all inputs.

---

## AI Assistant

`POST /api/ai/query` accepts `{ "question": "..." }` and returns a
natural-language answer by pattern-matching against real portal data — no
external LLM, no API key. It answers questions like:

- "What is the credentialing status for Dr. Smith at Aetna?"
- "Which payers are still pending for [practice name]?"
- "What follow-ups are due today?"

Ambiguous matches ask for clarification instead of guessing, answers are
scoped to the requesting user's assigned practices, and every query is written
to the audit log.

---

## Getting started

### Prerequisites

- Node.js 18+ and npm
- MongoDB (local, Atlas, or mongodb-memory-server for tests)
- Optional: Redis (Upstash or local) for early session revocation

### Backend

```bash
cd backend
cp .env.example .env      # then fill in your values
npm install
npm run dev               # http://localhost:5000
```

Create your first admin account (safe to re-run; it just resets the password):

```bash
npm run seed:admin
```

Default credentials: `admin@billvolt.com` / `Admin@12345` unless
`ADMIN_EMAIL` / `ADMIN_PASSWORD` are set in `.env`. Optional demo data:
`npm run seed:demo` (or `node src/scripts/seedDemo.js --reset` to wipe and
reseed).

Health check: `GET http://localhost:5000/api/health`.

### Frontend

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

`VITE_API_URL` defaults to `http://localhost:5000/api`. Sign in with the seeded
admin account.

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | no | API port (default 5000) |
| `NODE_ENV` | no | `development` / `production` |
| `MONGODB_URI` | yes | MongoDB connection string |
| `REDIS_URL` | no | Redis for refresh-token revocation; app runs without it |
| `JWT_SECRET` | yes | Signs access tokens (long random string) |
| `JWT_REFRESH_SECRET` | yes | Signs refresh tokens (different string) |
| `FIELD_ENCRYPTION_KEY` | yes | Encrypts SSN / CAQH credentials at rest |
| `CLIENT_URL` | no | Frontend origin for CORS (default `http://localhost:5173`) |
| `EMAIL_ENABLED`, `SMTP_*` | no | Follow-up notification emails; if unset, emails are logged to the console |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | no | Used only by `npm run seed:admin` |

> Generate secrets with:
> `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
> Do not rotate `FIELD_ENCRYPTION_KEY` after data exists — already-encrypted
> values become unreadable.

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
| `npm run seed:demo` | Load demo data into the local DB |
| `npm test` | Run the Jest + Supertest suite |

### Frontend (`cd frontend`)

| Script | Description |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) + production build |
| `npm run lint` | oxlint |
| `npm run preview` | Preview the production build |

---

## Testing

Backend tests run against an in-memory MongoDB, so `npm test` needs no real
database and no Redis:

```bash
cd backend
npm test
```

Coverage: wrong-password/unknown-email rejection, cookie-session login, token
refresh rotation, logout, practice CRUD + validation + search, staff blocked
from delete/users/sensitive (403), NoSQL injection attempt, all protected
routes reject unauthenticated requests (401), and FR-001 scoping (staff
lists/dashboard/reports filtered to assigned practices, 403 on unassigned
detail/write, admins unaffected). 24 tests across 4 suites.

The frontend has no automated test suite yet; it is covered by a manual QA
walkthrough (mobile responsiveness, notification interactions, sensitive-field
exposure, role gating, and per-practice scoping) that was executed during the
final module.

---

## Deployment

Production is split across **Render** (backend) and **Vercel** (frontend).

1. Push the repo to GitHub.
2. **Backend on Render** — use the included `render.yaml` blueprint. Render
   generates `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `FIELD_ENCRYPTION_KEY`
   automatically. Set `MONGODB_URI`, `CLIENT_URL`, and optional SMTP settings
   manually in the Render dashboard (never commit them). Health check is wired
   to `/api/health`.
3. **Frontend on Vercel** — import the repo, set the root directory to
   `frontend`, and set `VITE_API_URL` to the deployed backend URL + `/api`.
   `vercel.json` pins the build and adds an SPA rewrite so deep links survive
   page refreshes.
4. After the frontend is live, set `CLIENT_URL` on Render to the Vercel URL —
   CORS is locked to a single origin.
5. Seed the first admin account against the production `MONGODB_URI` and walk
   the manual QA checklist once against the live URLs.

> Live link: **https://medical-credentialing-portal.vercel.app/** (frontend on Vercel)
> Repository: **https://github.com/ali-akbar-019/billvolt-admin-panel**

---

## Roadmap

| Module | Focus | Status |
|---|---|---|
| 1 | Project setup, auth, dashboard UI, user management, responsive layout | Done |
| 2 | Practices, Providers, Credentialing Grid, CRUD, search/filtering | Done |
| 3 | Follow-ups, Timeline, Reports, AI Assistant, notifications, dashboard charts | Done |
| 4 | Settings, security audit, testing, deployment config, docs | Done |
| 5 | Audit log admin screen, report CSV export, follow-up email notifications | Done |
| 6 | FR-001 per-practice user assignment (scoping everywhere + admin UI) | Done |

## Known limitations

- No document repository yet: the practice workspace "Documents" tab is a
  placeholder (W-9s, licenses, payer contracts are not stored).
- Reports CSV export exists, but there is no on-screen date-range / archived
  report picker.
- Follow-up notifications are email-only (nodemailer digest); SMS transport is
  not built.
- The AI Assistant is deterministic pattern-matching, not an LLM — accurate and
  free, but limited to its recognized question patterns.
- No MFA, no frontend automated tests, no automated dependency scanning in CI.
