# BillVolt Admin Portal — Frontend

React + TypeScript single-page app (Vite) for the BillVolt Admin Portal.

## Stack

React 19, TypeScript, Vite, Tailwind CSS, React Router, Axios, Lucide icons.

## Structure

```
src/
├── api/           # Axios client with automatic token refresh
├── components/    # Shared UI, form modals, layout shell (Sidebar/Topbar)
├── constants/     # Shared display constants (e.g. credentialing statuses)
├── context/       # Auth + toast providers
├── pages/         # One file per route
├── routes/        # ProtectedRoute (role-aware)
└── types/         # Shared TypeScript types
```

## Getting started

```bash
npm install
cp .env.example .env   # VITE_API_URL defaults to http://localhost:5000/api
npm run dev            # http://localhost:5173
```

Point `VITE_API_URL` at the backend and sign in with a seeded account (see the
root `README.md` for backend setup and `npm run seed:admin`).

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) + production build |
| `npm run preview` | Preview the production build |

## Notes

- All state is fetched from the backend (`/api/*`) via the shared `apiClient`;
  there is no session state in `localStorage`.
- Access tokens live in httpOnly cookies; the response interceptor silently
  refreshes an expired access token and retries the failed request.
- Every page is responsive; the sidebar collapses into an off-canvas menu
  below 900px.

See the root `README.md` and `API_REFERENCE.md` for full details.