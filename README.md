# BillVolt Admin Portal

A full-stack admin dashboard for BillVolt, a medical billing and credentialing
company. The portal centralizes practice management, provider records,
credentialing tracking, follow-ups, reporting, and user administration into
a single internal tool, with an AI Assistant for quick data lookups.

**Status:** Modules 1–4 feature-complete (see Roadmap below).

## Docs

- **This file** — orientation, quick start, project structure
- `API_REFERENCE.md` — every endpoint, method, and access level
- `SECURITY.md` — audit findings and what's already hardened
- `DEPLOYMENT.md` — Render (backend) + Vercel (frontend) deployment steps
- `QA_CHECKLIST.md` — automated test coverage + manual walkthrough

## Tech Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router
**Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT Authentication, Zod
**Testing:** Jest, Supertest, mongodb-memory-server
**Tooling:** GitHub, Postman, Vercel (frontend), Render (backend)

## Project Structure

```
billvolt-admin-portal/
├── backend/
│   ├── src/
│   │   ├── config/       # DB + Redis connections
│   │   ├── controllers/  # Route handler logic
│   │   ├── middleware/   # Auth, validation, input sanitization
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/       # Express routers
│   │   ├── services/     # Cross-cutting logic (e.g. AI search engine)
│   │   ├── validators/   # Zod request schemas
│   │   ├── scripts/      # seed:admin
│   │   ├── app.js
│   │   └── server.js
│   └── tests/            # Jest + Supertest suite
├── frontend/
│   └── src/
│       ├── api/          # Axios client with auto token refresh
│       ├── components/   # Shared UI + form modals
│       ├── constants/     # Shared display constants (e.g. credentialing statuses)
│       ├── context/       # Auth + toast context
│       ├── pages/          # One file per route
│       └── types/          # Shared TypeScript types
├── render.yaml
└── frontend/vercel.json
```

## Data Models

- **User** — accounts with role-based access (admin/staff)
- **Practice** — medical practices/clinics
- **Provider** — healthcare provider records, linked to a practice; SSN and
  CAQH credentials encrypted at rest
- **CredentialingRecord** — provider × payer credentialing status, with an
  optional `nextFollowUpDate` that drives automatic FollowUp creation
- **TimelineEntry** — unlimited chronological activity log per credentialing record
- **FollowUp** — tasks/reminders, linked to a CredentialingRecord or Provider
- **OrgSettings** — single org-wide settings row
- **AuditLog** — tracks sensitive data access and changes

## Getting Started

### Backend

```bash
cd backend
cp .env.example .env    # fill in MONGODB_URI, REDIS_URL, and secrets
npm install
npm run dev              # http://localhost:5000

# Create your first admin account (defaults to admin@billvolt.com /
# Admin@12345 unless ADMIN_EMAIL / ADMIN_PASSWORD are set in .env —
# safe to re-run, it just resets the password):
npm run seed:admin
```

Health check: `GET http://localhost:5000/api/health` (reports DB + Redis status)

### Frontend

```bash
cd frontend
cp .env.example .env    # set VITE_API_URL if not using localhost:5000
npm install
npm run dev               # http://localhost:5173
```

### Running tests

```bash
cd backend
npm test
```

Runs against an in-memory MongoDB — no real database or Redis required.
See `QA_CHECKLIST.md` for full coverage and the manual walkthrough.

## Roadmap

| Module | Focus | Status |
|--------|-------|--------|
| 1 | Project setup, auth, dashboard UI, user management, responsive layout | ✅ Done |
| 2 | Practices, Providers, Credentialing Grid, CRUD, search/filtering | ✅ Done |
| 3 | Follow-ups, Timeline, Reports, AI Assistant, notifications | ✅ Done |
| 4 | Settings, security audit, testing, deployment config, docs | ✅ Done |

See `API_REFERENCE.md` for the full endpoint list.
