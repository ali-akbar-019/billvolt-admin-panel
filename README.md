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
cp .env.example .env    # fill in MONGODB_URI, JWT_SECRET
npm install
npm run dev              # http://localhost:5000
```

Health check: `GET http://localhost:5000/api/health`

Auth endpoints:
- `POST /api/auth/register` — create an account
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Frontend

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

## Roadmap

| Module | Focus |
|--------|-------|
| 1 | Project setup, auth, dashboard UI, user management, DB design |
| 2 | Practices, Providers, Credentialing Grid, CRUD, search/filtering |
| 3 | Follow-ups, Reports & Analytics, AI Assistant, notifications |
| 4 | Settings, testing, security hardening, deployment, docs |
