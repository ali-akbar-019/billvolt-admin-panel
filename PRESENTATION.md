# BillVolt Admin Portal — Project Summary

## What it is

A full-stack admin dashboard for a medical billing and credentialing
company: practices, providers, payer credentialing status, follow-up
reminders, activity history, reporting, an AI assistant for quick lookups,
and org settings — all behind role-based auth (admin/staff).

## Stack

React + TypeScript + Vite + Tailwind on the frontend; Node.js + Express +
MongoDB + Mongoose on the backend; JWT auth with httpOnly cookies and
rotating refresh tokens; Zod for request validation throughout.

## What's built, by module

**Module 1 — Foundation.** Auth (register/login/refresh/logout, rate
limited), RBAC middleware, a responsive dashboard shell with a mobile
sidebar drawer, and full user management (CRUD, roles, status).

**Module 2 — Core entities.** Practices and Providers, both with full CRUD,
search, filtering, and pagination. A Practice Workspace ties them together
with tabs for Info, Providers, Payer Grid, and Documents. Credentialing
records link a provider to a payer with a status, viewable both globally and
per-practice, with inline status editing.

**Module 3 — Workflow.** Setting a follow-up date on a credentialing record
automatically creates a task; a Follow-ups dashboard buckets everything into
Overdue/Today/Upcoming. An unlimited timeline log captures every call/email/
note per payer record instead of a single flat notes field. A Reports page
rolls up practice/provider/credentialing counts. An AI Assistant answers
natural-language questions about the portal's own data through a grounded
search pipeline — no external API key, no hallucination risk, since it can
only ever answer with what the search layer actually returns. A
notification bell surfaces overdue/due-today items anywhere in the app.

**Module 4 — Hardening.** Org-wide settings (admin-gated). A security audit
that found and fixed a real NoSQL operator-injection risk in list-endpoint
query params, applied globally via one middleware rather than patched
per-controller. A Jest + Supertest suite covering auth, CRUD, and RBAC
against an in-memory MongoDB. Deployment configs for Render (backend) and
Vercel (frontend). Documentation split into a clean README, a full API
reference, a security writeup, a deployment guide, and a QA checklist.

## Notable engineering decisions

- **SSN and CAQH credentials are encrypted at rest** (AES-256-GCM), hidden
  from normal API responses (`select: false`), and only decryptable through
  an admin-only, audit-logged endpoint.
- **Every sensitive action is audit logged** — who, what, when, from where,
  and (for status changes) what the value changed from/to.
- **The AI Assistant never queries the database directly.** It only calls a
  dedicated search service, which is the one place DB access happens — this
  is what makes future permission-scoping and auditing tractable without
  touching the agent logic itself.
- **The Credentialing↔FollowUp link is bidirectional and automatic**: set a
  date, get a task; clear it, the task goes away — no separate manual step.

## Known limitations (documented, not hidden)

- Per-practice user scoping (FR-001's "staff only see assigned practices")
  isn't implemented — every authenticated user currently sees every
  practice/provider. The codebase has an explicit no-op hook
  (`applyPermissionFilter` in `ai.controller.js`) marking where this plugs
  in later.
- No MFA yet.
- The AI Assistant is pattern-matching, not an LLM — accurate and free, but
  won't handle questions outside its three recognized intents.

See `README.md` for setup, `API_REFERENCE.md` for every endpoint,
`SECURITY.md` for the audit, `DEPLOYMENT.md` for going live, and
`QA_CHECKLIST.md` for test coverage.
