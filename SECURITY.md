# Security audit — Module 4, Day 2-3

A pass through the FR-008 requirements against the current codebase.

## Fixed this pass

**NoSQL operator injection via query-string objects.** Several list endpoints
(`/api/practices`, `/api/providers`, `/api/credentialing`, `/api/followups`)
assign query params straight into a Mongo filter, e.g.
`filter.practiceId = req.query.practiceId`. Express's default query parser
(`qs`) turns bracket syntax into nested objects — `?practiceId[$ne]=null`
becomes `req.query.practiceId = { $ne: 'null' }` — which would inject a live
Mongo operator into the filter and bypass the intended scoping.

Fix: `middleware/sanitizeInput.middleware.js`, applied globally in `app.js`
right after body/cookie parsing. It recursively strips any object key
starting with `$` or containing `.` from both `req.query` and `req.body`,
before any controller sees them. One fix protects every current and future
endpoint, instead of patching each controller individually.

## Verified clean (no changes needed)

- **RBAC** — every route file reviewed. All require `protect`; every
  destructive or sensitive action (`DELETE`, provider SSN/CAQH reveal, org
  settings writes, user management) additionally requires `authorize('admin')`.
- **Cookie security** — access/refresh tokens set `httpOnly`, `secure` in
  production, `sameSite: 'strict'`, with 15-min/7-day expiries.
- **Rate limiting** — 10 attempts/15 min on `/api/auth/login`, 300 req/15 min
  general API cap.
- **Security headers** — `helmet()` applied globally.
- **Startup validation** — `server.js` refuses to boot in production if
  `JWT_SECRET`, `JWT_REFRESH_SECRET`, `FIELD_ENCRYPTION_KEY`, or
  `MONGODB_URI` are missing.
- **Field encryption** — SSN and CAQH credentials use AES-256-GCM with a
  KDF-derived key (works regardless of the raw secret's length), `select:
  false` by default, and every reveal is audit logged.
- **Error handling** — the global error handler never leaks stack traces to
  the client; only `err.message`, and only outside production.

## Known gaps (out of scope for this build, flagged for later)

- Per-practice user assignment (FR-001's "General User only sees assigned
  practices") isn't implemented — every authenticated user can currently see
  every practice/provider. The AI assistant's `applyPermissionFilter` is a
  no-op stub for exactly this reason.
- No MFA — email/password only.
- No automated dependency vulnerability scanning (`npm audit` in CI) set up.
  Note: `npm audit` currently flags 2 high-severity advisories in
  `nodemailer`'s transitive deps — email is opt-in and falls back to console
  logging by default, but worth a review before enabling SMTP in production.
- No HIPAA/SOC 2 readiness review — that's a compliance exercise, not a code
  change.
