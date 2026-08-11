# API Reference

Base URL: `http://localhost:5000/api` in development (see `DEPLOYMENT.md` for
production). All endpoints except `/auth/login`, `/auth/refresh`, and
`/health` require an `accessToken` cookie (set automatically by the browser
after login — see `frontend/src/api/client.ts`).

## Auth

| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/auth/register` | admin | Creates a staff or admin account. No public self-signup. Accepts optional `assignedPracticeIds` (ignored for admins). |
| POST | `/auth/login` | public | Rate limited to 10 attempts / 15 min. |
| POST | `/auth/refresh` | — | Rotates the refresh token. |
| POST | `/auth/logout` | authenticated | Clears cookies, revokes the session if Redis is configured. |
| GET | `/auth/me` | authenticated | Returns the current user. |

## Users

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/users` | admin | List all users. |
| PATCH | `/users/:id` | admin | Update `role`, `status`, or `assignedPracticeIds` (array of practice ids). Assignment changes are audit logged. |
| DELETE | `/users/:id` | admin | Remove a user. |

> **FR-001 scoping.** Staff accounts see only the practices listed in
> `assignedPracticeIds` — that filter is applied to every list/detail/write
> endpoint (practices, providers, credentialing, timeline, follow-ups,
> dashboard, reports, and the AI assistant). Admins are unrestricted. A staff
> user with no assignments sees empty lists. Data created by staff in an
> assigned practice stays inside it.

## Practices

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/practices` | authenticated | `?q=`, `?status=`, `?page=`, `?limit=` |
| GET | `/practices/:id` | authenticated | Includes linked providers. |
| POST | `/practices` | authenticated | Create. |
| PATCH | `/practices/:id` | authenticated | Update. |
| DELETE | `/practices/:id` | admin | |

## Providers

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/providers` | authenticated | `?q=`, `?practiceId=`, `?status=`, `?specialty=`, `?page=`, `?limit=` |
| GET | `/providers/:id` | authenticated | SSN and CAQH credentials excluded. |
| GET | `/providers/:id/sensitive` | admin | Decrypts SSN + CAQH credentials. Audit logged every call. |
| POST | `/providers` | authenticated | Requires `practiceId`. |
| PATCH | `/providers/:id` | authenticated | |
| DELETE | `/providers/:id` | admin | |

## Credentialing

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/credentialing` | authenticated | `?providerId=`, `?practiceId=` (rolls up that practice's providers), `?status=`, `?payerName=`, `?page=`, `?limit=` |
| GET | `/credentialing/:id` | authenticated | |
| POST | `/credentialing` | authenticated | Requires `providerId` + `payerName`; one record per pair. |
| PATCH | `/credentialing/:id` | authenticated | Status changes are audit logged with from/to. Setting `nextFollowUpDate` auto-creates/reschedules a linked FollowUp; clearing it removes the pending task. |
| DELETE | `/credentialing/:id` | admin | |

## Timeline (per credentialing record)

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/timeline?credentialingRecordId=` | authenticated | Newest first, no pagination cap. |
| POST | `/timeline` | authenticated | Log a call/email/note. |
| DELETE | `/timeline/:id` | admin | Entries are otherwise immutable. |

## Follow-ups

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/followups` | authenticated | `?bucket=today\|upcoming\|overdue`, `?status=`, `?assignedTo=`, `?page=`, `?limit=`. Overdue items include `daysOverdue`. |
| GET | `/followups/counts` | authenticated | Today/overdue/upcoming counts. |
| GET | `/followups/:id` | authenticated | |
| POST | `/followups` | authenticated | Requires `linkedType`, `linkedId`, `dueDate`. Creates/sends a notification digest when due today or overdue (SMTP configured) or logs it to the console (not configured). |
| PATCH | `/followups/:id` | authenticated | Reschedule, reassign, or `{ "status": "completed" }`. |
| POST | `/followups/notify` | admin | Manual digest re-send for all pending overdue / due-today follow-ups. Audit logged. |
| DELETE | `/followups/:id` | admin | |

## Audit log (admin)

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/audit-logs` | admin | List `AuditLog` entries newest-first. `?action=`, `?resourceType=`, `?userId=`, `?from=`, `?to=`, `?page=`, `?limit=` (max 200). `userId` populated to `name`/`email`. Covers record creates/updates/deletes, sensitive-data reveals, settings changes, and manual notification sends. |

## Dashboard & Reports

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/dashboard/summary` | authenticated | Stat totals (active practices, approved-this-month, pending credentialing) plus provider totals, follow-up counts (overdue/due today/upcoming/completed), credentialing breakdown by status, 6-month activity trend, and top 5 payers by volume. Powers every Dashboard card and chart. |
| GET | `/reports/summary` | authenticated | Practice/provider totals, credentialing by status, top 5 payers by volume. |
| GET | `/reports/export` | authenticated | Full CSV download (`text/csv`, attachment filename `reports-YYYY-MM-DD.csv`). Sections: summary counts, practices, providers, credentialing records. |

## AI Assistant

| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/ai/query` | authenticated | `{ "question": "..." }`. Pattern-matching against real data (no external LLM, no API key needed) — handles provider+payer status, practice-level pending payers, and today's follow-ups. Ambiguous matches ask for clarification instead of guessing. Every query is audit logged. |

## Settings

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/settings` | authenticated | Single org-wide row, created lazily on first access. `contactEmail` is used as the fallback recipient for follow-up notification digests. |
| PATCH | `/settings` | admin | `orgName`, `timezone`, `contactEmail`, `sessionTimeoutMinutes`, `notifyOnOverdueFollowUps` (toggle for the notification digest). |

## Health

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/health` | public | Reports DB + Redis connection status. |
