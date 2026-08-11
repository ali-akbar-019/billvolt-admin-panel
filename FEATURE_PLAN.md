# Feature Plan — Phase 5 (post-Module-4)

Scope for the next round of work. **Excluded:** the document repository (S3/GridFS)
and frontend automated tests — those stay deferred per `PROGRESS.md`. Testing for
these features is manual for now.

---

## Feature 1 — Audit log admin screen

**Goal:** give admins a screen to browse the `AuditLog` records the backend already
writes (sensitive-data reveals, record creates/updates/deletes, settings changes).

### Backend
- [x] New route file `backend/src/routes/auditLog.routes.js`, mounted at `/api/audit-logs`, `protect + authorize('admin')`.
- [x] New controller `backend/src/controllers/auditLog.controller.js`:
  - `listLogs` — GET with filters (`action`, `resourceType`, `userId`, date range `from`/`to`), pagination (`page`/`limit`), sorted newest first.
  - Populate `userId` → `name`, `email`.
  - Optional `GET /export` for CSV (reuse the mailer-free pattern; plain response, no library).
- [x] Audit the audit-log access itself (self-referential but consistent).

### Frontend
- [x] New page `frontend/src/pages/AuditLogs.tsx`: filter bar (action, resource type, user, date range), `.table-scroll` table, pagination controls.
- [x] Route `/audit-logs` (admin) in `App.tsx`.
- [x] Admin menu item in `Sidebar.tsx` (icon `ScrollText` or `History`).

---

## Feature 2 — Report export (CSV)

**Goal:** download the current reports snapshot as CSV.

### Backend
- [x] `reports.controller.js`: add `getSummaryCsv` (or `format=csv` on `/reports/summary`) that emits:
  - Section 1: practices (name, NPI, status)
  - Section 2: providers (name, NPI, practice, specialty, status)
  - Section 3: credentialing records (provider, payer, status, submitted, expiration, next follow-up)
  - Section 4: summary counts.
- [x] Content-Type `text/csv` + `Content-Disposition: attachment; filename="reports-YYYY-MM-DD.csv"`.
- [x] Route `GET /api/reports/export` (authenticated).

### Frontend
- [x] Reports page: "Export CSV" button → triggers browser download (blob from `apiClient`).
- [x] Toast on failure; loading state on button.

---

## Feature 3 — Follow-up notifications (nodemailer)

**Goal:** email assigned users (or org contact) when follow-ups are due/overdue.
SMTP via nodemailer; **if SMTP isn't configured, fall back to console logging** so
the app still works locally with zero config.

### Backend
- [x] Add `nodemailer` dependency to `backend/package.json`.
- [x] New service `backend/src/services/mailer.service.js`:
  - Reads `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `EMAIL_ENABLED` from env.
  - `sendMail({ to, subject, text })` — if disabled/no creds → `console.log` the email instead of sending.
- [x] New service `backend/src/services/followUpNotify.service.js`:
  - `sendFollowUpDigest(followUps)` — composes a digest of pending overdue/today follow-ups, addressed to each `assignedTo.email` (fallback org `contactEmail`), sends via mailer.
- [x] Hook: after follow-up create/update and after credentialing `syncFollowUp`, if due date is today/past and status pending → trigger notification. Also a `POST /api/followups/notify` (admin) manual re-send.
- [x] Respect `OrgSettings.notifyOnOverdueFollowUps` toggle.
- [x] `.env.example`: add SMTP_* + EMAIL_ENABLED entries with comments.

### Frontend
- [x] No UI strictly needed; optionally a "Send notification" button on the follow-ups page (admin). Keep minimal. (Not added — manual `POST /api/followups/notify` covers it.)

---

## Shared conventions

- Backend: follow existing patterns — Zod validators, `protect`/`authorize` middleware, audit logging, pagination guardrails (max limit 200), `.env.example` entries.
- Frontend: inline styles + existing CSS classes (`surface-card`, `table-scroll`, `input-control`, `select-control`, `status-select`), responsive-friendly (wrapped toolbars, scrollable tables).
- No `npm run build` / `npm test` in this pass — user runs builds/tests manually and will report issues.

## Order of work

1. Mailer service + env + follow-up notification hooks (backend-only, self-contained).
2. Audit log backend endpoint.
3. Audit log frontend page + route + sidebar.
4. Reports CSV backend endpoint.
5. Reports CSV frontend button.
6. Update `PROGRESS.md` + `FEATURE_PLAN.md` checkboxes; leave `API_REFERENCE.md` update for the user or a final pass.
