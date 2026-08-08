# BillVolt Admin Portal

A full-stack admin dashboard for BillVolt, a medical billing and credentialing
company. The portal centralizes practice management, provider records,
credentialing tracking, follow-ups, reporting, and user administration into
a single internal tool, with an AI Assistant for quick data lookups.

**Status:** In development

## Tech Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router
**Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT Authentication
**Tooling:** GitHub, Postman, Cloudinary, Vercel (frontend), Render (backend)

## Project Structure

```
billvolt-admin-portal/
├── backend/
│   └── src/
│       ├── config/       # DB connection
│       ├── controllers/  # Route handler logic
│       ├── middleware/   # Auth, validation
│       ├── models/       # Mongoose schemas
│       ├── routes/       # Express routers
│       ├── validators/   # Request validation schemas
│       ├── app.js
│       └── server.js
└── frontend/
    └── src/
```

## Data Models

- **User** — accounts with role-based access (admin/staff)
- **Practice** — medical practices/clinics
- **Provider** — healthcare provider records, linked to a practice
- **CredentialingRecord** — provider × payer credentialing status
- **FollowUp** — tasks/reminders tied to credentialing records
- **AuditLog** — tracks sensitive data access and changes

## Getting Started

### Backend

```bash
cd backend
cp .env.example .env    # fill in MONGODB_URI, REDIS_URL, and secrets
npm install
npm run dev              # http://localhost:5000

# Once connected, create your first admin account (defaults to
# admin@billvolt.com / Admin@12345 unless ADMIN_EMAIL / ADMIN_PASSWORD
# are set in .env — safe to re-run, it just resets the password):
npm run seed:admin
```

Health check: `GET http://localhost:5000/api/health` (reports DB + Redis status)

Auth endpoints:
- `POST /api/auth/register` — admin-only, creates staff/admin accounts
- `POST /api/auth/login`
- `POST /api/auth/refresh` — rotates the refresh token
- `POST /api/auth/logout`
- `GET /api/auth/me`

**Security notes:**
- Access tokens are short-lived (15 min); refresh tokens rotate on every use and are tracked in Redis so a session can be revoked instantly
- Provider SSNs are encrypted at rest (AES-256-GCM)
- Rate limiting on login to slow brute-force attempts
- RBAC enforced server-side via middleware (admin/staff roles)

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

Login page and Dashboard are fully styled — matching the design system
(colors, typography, card elevation).

**User Management** (admin only) is now fully functional: list all users,
change roles, activate/disable accounts, remove users, and add new team
members — with toast notifications for feedback. Other modules still show
a placeholder until built.

Admin endpoints:
- `GET /api/users` — list all users
- `PATCH /api/users/:id` — update role/status
- `DELETE /api/users/:id` — remove a user

Practice endpoints (any authenticated user, delete is admin-only):
- `GET /api/practices` — list, with `?q=`, `?status=`, `?page=`, `?limit=`
- `GET /api/practices/:id` — single practice, with linked providers
- `POST /api/practices` — create
- `PATCH /api/practices/:id` — update
- `DELETE /api/practices/:id` — admin only

Provider endpoints (any authenticated user, sensitive fields + delete are admin-only):
- `GET /api/providers` — list, with `?q=`, `?practiceId=`, `?status=`, `?specialty=`, `?page=`, `?limit=`
- `GET /api/providers/:id` — single provider (SSN and CAQH credentials excluded)
- `GET /api/providers/:id/sensitive` — admin only, decrypts SSN + CAQH username/password, every call is audit logged
- `POST /api/providers` — create (requires `practiceId`)
- `PATCH /api/providers/:id` — update
- `DELETE /api/providers/:id` — admin only

Credentialing endpoints (any authenticated user, delete is admin-only):
- `GET /api/credentialing` — list, with `?providerId=`, `?practiceId=` (rolls up all of that practice's providers), `?status=`, `?payerName=`, `?page=`, `?limit=`
- `GET /api/credentialing/:id` — single record
- `POST /api/credentialing` — create (requires `providerId` + `payerName`, one record per provider+payer pair)
- `PATCH /api/credentialing/:id` — update (status changes are audit logged with from/to)
- `DELETE /api/credentialing/:id` — admin only

Dashboard endpoint:
- `GET /api/dashboard/summary` — active practice count, approved-this-month count, pending credentialing count

Follow-up endpoints (any authenticated user, delete is admin-only):
- `GET /api/followups` — list, with `?bucket=today|upcoming|overdue`, `?status=`, `?assignedTo=`, `?page=`, `?limit=` — overdue items include a `daysOverdue` count
- `GET /api/followups/counts` — today/overdue/upcoming counts for dashboard badges
- `GET /api/followups/:id` — single follow-up
- `POST /api/followups` — create manually (requires `linkedType`, `linkedId`, `dueDate`)
- `PATCH /api/followups/:id` — reschedule, reassign, or mark complete (`{ "status": "completed" }`)
- `DELETE /api/followups/:id` — admin only

Timeline endpoints (unlimited chronological log per payer record, entries are otherwise immutable):
- `GET /api/timeline?credentialingRecordId=` — newest first, no pagination cap
- `POST /api/timeline` — log a call/email/note against a credentialing record
- `DELETE /api/timeline/:id` — admin only

Reports endpoint:
- `GET /api/reports/summary` — practice/provider totals, credentialing counts by status, top 5 payers by volume

AI Assistant endpoint:
- `POST /api/ai/query` — `{ "question": "..." }`. Handles three intents: provider+payer status ("status for Dr. Khan payer Aetna"), practice-level pending payers ("pending payers for Acme Medical Group"), and today's follow-ups ("what follow-ups are due today"). Ambiguous matches (e.g. two providers with similar names) return a clarifying question instead of guessing. Every query is audit logged with the question and the response given. This is pattern-matching against the database, not a call to an external LLM — no API key is required.

The topbar's notification bell polls `/api/followups/counts` every 60s and shows overdue + due-today follow-ups in a dropdown.

Note: setting `nextFollowUpDate` on a credentialing record (`PATCH /api/credentialing/:id`) automatically creates or reschedules its linked follow-up task; clearing the date removes the pending task.

## Roadmap

| Module | Focus |
|--------|-------|
| 1 | Project setup, auth, dashboard UI, user management, DB design |
| 2 | Practices, Providers, Credentialing Grid, CRUD, search/filtering |
| 3 | Follow-ups, Reports & Analytics, AI Assistant, notifications |
| 4 | Settings, testing, security hardening, deployment, docs |
