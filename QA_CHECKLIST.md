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
- [ ] Fresh clone → `npm install` (both folders) → `npm run seed:admin` → login works
- [ ] Create a practice → add a provider to it → add a payer record → set a
      follow-up date → confirm the follow-up appears on `/follow-ups`
- [ ] Mark that follow-up complete → confirm it disappears from the bell dropdown
- [ ] Log a timeline note on the payer record → reopen the record → note persists
- [ ] Dashboard numbers match what's actually in the DB (spot-check one)
- [ ] Reports page bars match the same data
- [ ] Ask the AI assistant a real question about data you just created
- [ ] Resize the browser to a phone width — sidebar collapses to a drawer, no
      horizontal overflow on any table
- [ ] Log in as a non-admin (staff) account — confirm Settings fields are
      disabled and admin-only buttons/routes are hidden or blocked
- [ ] Try `GET /api/providers/:id` as any authenticated user — confirm `ssn`
      and `caqh.username`/`password` are absent from the response
