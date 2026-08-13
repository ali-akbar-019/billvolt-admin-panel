# QA checklist — Module 4, Day 4

## Automated (backend/tests/, run with `npm test` inside `backend/`)

- [x] Login rejects wrong password / unknown email
- [x] Login succeeds and sets httpOnly access + refresh cookies
- [x] `/me` rejects requests with no cookie, returns the user with a valid one
- [x] Refresh rotates the token pair
- [x] Logout clears both cookies
- [x] Practice CRUD: create validation (missing `groupName` rejected), create → list → update → search-by-name
- [x] Staff (non-admin) blocked from deleting a practice (403)
- [x] NoSQL injection attempt via `?status[$ne]=active` doesn't crash or bypass filtering
- [x] Staff blocked from `/api/users` (403), admin allowed (200)
- [x] Staff blocked from a provider's `/sensitive` endpoint (403)
- [x] Every protected route rejects unauthenticated requests (401)

These use an in-memory MongoDB (`mongodb-memory-server`), so `npm test` doesn't
touch your real database and needs no `MONGODB_URI`.

## Manual — walk this end to end before considering Module 4 done

- [x] Fresh clone → `npm install` (both folders) → `npm run seed:admin` → login works
- [x] Create a practice → add a provider to it → add a payer record → set a
      follow-up date → confirm the follow-up appears on `/follow-ups`
- [x] Mark that follow-up complete → confirm it disappears from the bell dropdown
- [x] Log a timeline note on the payer record → reopen the record → note persists
- [x] Dashboard numbers match what's actually in the DB (spot-check one)
- [x] Reports page bars match the same data
- [x] Ask the AI assistant a real question about data you just created
- [x] Resize the browser to a phone width — sidebar collapses to a drawer, no
      horizontal overflow on any table
- [x] Log in as a non-admin (staff) account — confirm Settings fields are
      disabled and admin-only buttons/routes are hidden or blocked
- [x] Try `GET /api/providers/:id` as any authenticated user — confirm `ssn`
      and `caqh.username`/`password` are absent from the response

## Phase 5 — new flows

- [x] Open `/audit-log` as admin — filter by action, resource type, user, and
      date range; page through results; entries show who/what/when
- [x] As staff, `/audit-log` is blocked (route hidden, API returns 403)
- [x] Open `/reports`, click "Export CSV" — a `reports-YYYY-MM-DD.csv` downloads
      with Summary / Practices / Providers / Credentialing sections
- [x] Unauthenticated `GET /api/reports/export` is rejected (401)
- [x] Set a follow-up due today with status pending (or post
      `PATCH /api/followups/:id` to make an existing one overdue) — the console
      shows the nodemailer fallback digest when SMTP isn't configured:
      `[mailer] SMTP not configured — would send email to ...`
- [x] Admin `POST /api/followups/notify` re-sends the digest; staff gets 403;
      the send is recorded in `/audit-log`
- [x] Update the overdue-notification toggle in Settings (`/settings`) and
      confirm it flips notification behavior

## FR-001 — per-practice scoping

- [x] Log in as demo staff (`sarah.mitchell@billvolt.com` / `Staff@12345`) —
      Practices, Providers, Credentialing, Follow-ups, Dashboard, and Reports
      only show the practices seeded to that user (a subset of the 5)
- [x] Admin can open User management and change a staff user's practice
      assignments; the change appears in `/audit-log`
- [x] As staff, try opening a practice/provider/credentialing record from an
      unassigned practice directly by URL — expect a "no access" message
      (backend 403)
- [x] As staff, try creating a provider under an unassigned practice — blocked;
      creating inside an assigned practice works
- [x] Staff user with zero assignments sees empty lists, not everyone else's data
- [x] Admin account sees all practices regardless of any assignments
