# API Reference

Base URL: `http://localhost:5000/api` in development (see `DEPLOYMENT.md` for
production). All endpoints except `/auth/login`, `/auth/refresh`, and
`/health` require an `accessToken` cookie (set automatically by the browser
after login — see `frontend/src/api/client.ts`).

## Auth

| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/auth/register` | admin | Creates a staff or admin account. No public self-signup. |
| POST | `/auth/login` | public | Rate limited to 10 attempts / 15 min. |
| POST | `/auth/refresh` | — | Rotates the refresh token. |
| POST | `/auth/logout` | authenticated | Clears cookies, revokes the session if Redis is configured. |
| GET | `/auth/me` | authenticated | Returns the current user. |

## Users

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/users` | admin | List all users. |
| PATCH | `/users/:id` | admin | Update role/status. |
| DELETE | `/users/:id` | admin | Remove a user. |

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
| POST | `/followups` | authenticated | Requires `linkedType`, `linkedId`, `dueDate`. |
| PATCH | `/followups/:id` | authenticated | Reschedule, reassign, or `{ "status": "completed" }`. |
| DELETE | `/followups/:id` | admin | |

## Dashboard & Reports

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/dashboard/summary` | authenticated | Active practice count, approved-this-month count, pending credentialing count. |
| GET | `/reports/summary` | authenticated | Practice/provider totals, credentialing by status, top 5 payers by volume. |

## AI Assistant

| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/ai/query` | authenticated | `{ "question": "..." }`. Pattern-matching against real data (no external LLM, no API key needed) — handles provider+payer status, practice-level pending payers, and today's follow-ups. Ambiguous matches ask for clarification instead of guessing. Every query is audit logged. |

## Settings

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/settings` | authenticated | Single org-wide row, created lazily on first access. |
| PATCH | `/settings` | admin | `orgName`, `timezone`, `contactEmail`, `sessionTimeoutMinutes`, `notifyOnOverdueFollowUps`. |

## Health

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/health` | public | Reports DB + Redis connection status. |
