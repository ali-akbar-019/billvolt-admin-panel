# BillVolt Admin Portal

Internship project — full-stack admin dashboard for BillVolt, a medical billing,
revenue cycle management, and credentialing company. The portal centralizes
practice management, provider records, credentialing tracking, follow-ups,
reporting, and user administration into a single internal tool, with an
AI Assistant for quick data lookups.

**Status:** 🚧 In development — Day 1 setup (Module 1 in progress)

## Tech Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router
**Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT Authentication
**Tooling:** GitHub, Postman, Cloudinary, Vercel (frontend), Render (backend)

## Project Structure

```
billvolt-admin-portal/
├── backend/          # Express API
│   └── src/
│       ├── config/       # DB connection, env config
│       ├── controllers/  # Route handler logic
│       ├── middleware/   # Auth, error handling, etc.
│       ├── models/       # Mongoose schemas
│       ├── routes/       # Express routers
│       ├── app.js        # Express app setup
│       └── server.js     # Entry point
└── frontend/         # React (Vite) app
    └── src/
```

## Getting Started

### Backend

```bash
cd backend
cp .env.example .env    # fill in MONGODB_URI, JWT_SECRET, etc.
npm install
npm run dev              # starts on http://localhost:5000
```

Health check: `GET http://localhost:5000/api/health`

### Frontend

```bash
cd frontend
npm install
npm run dev               # starts on http://localhost:5173
```

## Roadmap

| Module | Dates | Focus |
|--------|-------|-------|
| 1 | Jul 20 – Jul 26 | Project setup, auth (RBAC), dashboard UI, user management, DB design |
| 2 | Jul 27 – Aug 02 | Practices, Providers, Credentialing Grid, CRUD, search/filtering |
| 3 | Aug 03 – Aug 09 | Follow-ups, Reports & Analytics, AI Assistant (Gemini), notifications |
| 4 | Aug 10 – Aug 15 | Settings, testing, security hardening, deployment, docs |

## Modules (Planned)

- **Dashboard** — real-time overview and key metrics
- **Practices** — manage medical practices/clinics
- **Providers** — manage healthcare provider records
- **Credentialing Grid** — provider × payer credentialing status tracking
- **Follow-ups** — task/reminder tracking tied to credentialing items
- **Reports & Analytics** — exportable reports (PDF, CSV)
- **AI Assistant** — natural-language queries over portal data (Gemini API)
- **User Management** — role-based access control (Admin / Staff)
- **Settings** — system configuration

## Author

Ali Akbar — Full Stack Web Development Intern
Internship ID: ZYNVEX-CERT-0830
