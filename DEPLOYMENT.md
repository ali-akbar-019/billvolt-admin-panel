# Deployment guide — Module 4, Day 5

Backend → Render, frontend → Vercel, per the original tech stack.

## Backend (Render)

1. Push this repo to GitHub.
2. In Render: **New → Blueprint**, point it at the repo — it'll pick up
   `render.yaml` at the root automatically.
3. `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `FIELD_ENCRYPTION_KEY` are set to
   `generateValue: true`, so Render generates them for you. **Don't
   regenerate these after going live** — rotating `FIELD_ENCRYPTION_KEY`
   makes every already-encrypted SSN/CAQH credential unreadable.
4. Manually set in the Render dashboard (marked `sync: false` so they're
   never committed):
   - `MONGODB_URI` — your Atlas (or other) connection string
   - `REDIS_URL` — optional; without it, sessions/rate-limit-backed features
     degrade gracefully but still work (see `SECURITY.md`)
   - `CLIENT_URL` — your Vercel URL, once you have it (needed for CORS)
5. Health check is wired to `/api/health` — Render will restart the service
   if it stops responding there.

## Frontend (Vercel)

1. Import the repo in Vercel, set **root directory** to `frontend`.
2. Vercel auto-detects the Vite build (`vercel.json` pins
   `buildCommand`/`outputDirectory` and adds the SPA rewrite rule so
   client-side routes like `/practices/:id` don't 404 on refresh).
3. Set the env var `VITE_API_URL` to your Render backend URL + `/api`
   (e.g. `https://billvolt-backend.onrender.com/api`).
4. Deploy. Then go back to Render and set `CLIENT_URL` to this Vercel URL
   — CORS is locked to a single origin by design (`app.js`), so both sides
   need to point at each other correctly or every request will be blocked.

## After first deploy

- Run `npm run seed:admin` — either locally against the production
  `MONGODB_URI`, or via Render's shell — to create the first admin login.
- Walk through `QA_CHECKLIST.md`'s manual section once against the live URLs.
