# Production Smoke Report

Date (UTC): 2026-01-14

## Target

- Backend (Render): `https://marketingkreis-cimu.onrender.com`
- DB (Render Postgres): `marketingkreis-db` (`dpg-d5focl3e5dus73d25jf0-a`)
- Render service: `MarketingKreis` (`srv-d5fo33q4d50c73falsh0`)
- Latest env deploy (Render): `dep-d5jqer96pt7s73bc5cug` (status: live)

## Smoke scenario (backend)

Executed via `scripts/prod_smoke_backend.py`:

- Health check (`GET /health`)
- Register (`POST /auth/register`)
- Login (`POST /auth/login`, cookie-based)
- Profile (`GET /auth/profile`)
- Upload + import CSV (`POST /uploads`)
- Verify uploads list (`GET /uploads`)
- Verify imported activity exists (`GET /activities`)
- Verify CRM stats reachable (`GET /crm/stats`)

### Result

**PASS** (completed in ~5s)

## Notes / follow-ups

- **Render TrustedHost fix applied**: backend now answers `GET /health` with `200` (was `400 Invalid host header` before).
- **Frontend end-to-end smoke via Vercel is currently blocked**:
  - `POST /api/auth/register` on `kreismmmarketing.vercel.app` returns `500 {"error":"This operation was aborted"}`.
  - This strongly indicates the frontend's `BACKEND_URL` (Vercel env) points to an unreachable backend URL or the backend is cold-starting beyond the proxy timeout.
  - Fix: set **Vercel env** `BACKEND_URL=https://marketingkreis-cimu.onrender.com` and redeploy the frontend.

