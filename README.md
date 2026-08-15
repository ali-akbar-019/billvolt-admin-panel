# BillVolt Admin Portal

**Run your credentialing operation without spreadsheets.**

> Live demo: **https://medical-credentialing-portal.vercel.app/**
> Source: **https://github.com/ali-akbar-019/billvolt-admin-panel**
> Full documentation: **[DOCUMENTATION.md](DOCUMENTATION.md)**

BillVolt is a full-stack admin portal for **medical billing companies,
credentialing services, and healthcare practices** that need to track provider
enrollments, payer applications, and follow-ups in one place — instead of piles
of Excel sheets, emails, shared drives, and sticky notes.

## What it replaces

| Instead of… | BillVolt gives you… |
|---|---|
| Excel spreadsheets shared over email | A centralized credentialing grid with one record per provider x payer |
| Sticky notes and memory for follow-ups | Automatic follow-up tasks whenever a credentialing record needs attention |
| Scattered emails and phone notes | A per-record timeline logging every call, email, and status change |
| Manual status tracking | One-click status updates (not started to submitted to approved / denied) |
| Rebuilding the same reports each week | Live dashboards, pipeline charts, and report summaries |

## Highlights

- Cookie-based JWT auth with automatic token refresh, login rate limiting, and
  two roles (`admin` / `staff`). Staff who open an admin URL are signed out,
  not shown the page.
- FR-001 per-practice scoping: staff only see the practices an admin assigns
  to them, across every screen and the AI Assistant.
- Credentialing grid with automatic follow-ups, per-record timeline, audit log,
  CSV report export, and follow-up email digests.
- Sensitive provider fields (SSN, CAQH credentials) encrypted at rest and only
  readable through an admin-only, audit-logged endpoint.
- AI Assistant that answers questions from your real data — no external LLM or
  API key required.

## Quick start

```bash
# Backend (http://localhost:5000)
cd backend
cp .env.example .env
npm install
npm run dev
npm run seed:admin    # creates/resets the admin account

# Frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
```

Sign in with the seeded admin account. For details (setup, env vars, API
reference, security, testing, deployment), see **[DOCUMENTATION.md](DOCUMENTATION.md)**.

## Status

Modules 1–6 feature-complete (foundation, core entities, workflow, hardening,
admin tooling, and per-practice scoping). Backend test suite: 24 tests passing.

## Tech stack

React 19 + TypeScript + Vite + Tailwind (frontend); Node.js + Express +
MongoDB + Mongoose + JWT + Zod (backend); Redis optional; Jest + Supertest for
tests; Vercel + Render for deployment.

## License

Proprietary — internal tooling for BillVolt. Not licensed for external use or
redistribution.
