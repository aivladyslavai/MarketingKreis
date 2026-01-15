# Production Smoke Report

Date (UTC): 2026-01-15

## Target

- Backend (Render): `https://marketingkreis-cimu.onrender.com`
- DB (Render Postgres): `marketingkreis-db` (`dpg-d5focl3e5dus73d25jf0-a`)
- Render service: `MarketingKreis` (`srv-d5fo33q4d50c73falsh0`)
- Latest deploy (Render): `dep-d5kcbfnpm1nc73c3p680` (status: live)

## Smoke scenario (backend)

Executed via `scripts/prod_smoke_backend.py`:

- Health check (`GET /health`)
- Register (`POST /auth/register`)
- Login (`POST /auth/login`, cookie-based)
- Profile (`GET /auth/profile`)
- Create CRM company (with extra fields) (`POST /crm/companies`)
- Upload + import CSV (`POST /uploads`)
- Verify uploads list (`GET /uploads`)
- Verify imported activity exists (`GET /activities`)
- Verify CRM stats reachable (`GET /crm/stats`)

### Result

**PASS** (completed in ~6s)

## DB verification (Render Postgres)

- `alembic_version.version_num`: `20260115_0003`
- Companies extra fields exist (nullable):
  - `contact_person_*`, `vat_id`, `lead_source`, `priority`, `next_follow_up_at`, `linkedin_url`, `tags`
- Upload storage columns exist:
  - `uploads.content` (bytea), `uploads.sha256`, `uploads.stored_in_db`
- Email uniqueness index present:
  - `ux_users_email_lower` on `lower(email)`

## Notes / follow-ups

- **Render TrustedHost fix applied**: backend now answers `GET /health` with `200` (was `400 Invalid host header` before).
- **Frontend end-to-end smoke via Vercel is currently blocked**:
  - `GET /api/auth/profile` on `kreismmmarketing.vercel.app` hangs (no response within 40s).
  - `POST /api/auth/login` returns `500 {"detail":"Internal error"}` after ~9–11s.
  - This strongly indicates the frontend's `BACKEND_URL` (Vercel env) points to an unreachable backend URL or is misconfigured.
  - Fix: set **Vercel env** `BACKEND_URL=https://marketingkreis-cimu.onrender.com` and redeploy the frontend.

