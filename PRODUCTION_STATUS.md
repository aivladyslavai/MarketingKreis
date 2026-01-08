# Marketing Kreis Platform - Production Status

## Deployment Checklist

- [x] Backend env loading: `.env.production` supported via `ENVIRONMENT=production`
- [x] JWT cookies: HttpOnly, SameSite=Lax, Secure (prod)
- [x] CSRF middleware (origin/referer check) enabled in prod
- [x] TrustedHost middleware configured for `marketingkreis.ch` domain
- [x] Alembic migrations applied to head (includes `budget_targets`, `kpi_targets`)
- [x] Budget API implemented: `/budget/targets/{period}` GET/POST
- [x] Frontend credentials: all fetches use `credentials: "include"`
- [x] Next.js rewrites for production -> `https://app.marketingkreis.ch`
- [x] Frontend production build OK (`npm run build`)
- [x] Performance/Activities/CRM/Budget pages render with live data

## Environment Variables (production)

- `ENVIRONMENT=production`
- `DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/marketingkreis` (set real creds)
- `JWT_SECRET_KEY=<secure 64+ chars>`
- `JWT_ALGORITHM=HS256`
- `ACCESS_TOKEN_EXPIRE_MINUTES=60`
- `REFRESH_TOKEN_EXPIRE_MINUTES=43200`
- `BACKEND_CORS_ORIGINS=https://marketingkreis.ch,https://app.marketingkreis.ch`
- `COOKIE_DOMAIN=.marketingkreis.ch`
- `COOKIE_SECURE=true`
- `COOKIE_SAMESITE=lax`
- `COOKIE_ACCESS_NAME=access_token`
- `COOKIE_REFRESH_NAME=refresh_token`
- `CSRF_SECRET_KEY=<secure 64+ chars>`
- `SENTRY_ENV=production`

Note: create `backend/.env.production` with these values and strong secrets.

## Verified Endpoints

- `GET /health` -> {"status":"ok"}
- `POST /auth/login` -> sets access/refresh cookies, `X-Redirect-To: /dashboard`
- `GET /activities` CRUD -> OK
- `GET /calendar` CRUD -> OK
- `GET /crm/companies|contacts|deals` -> OK
- `GET /performance` (composite via frontend) -> OK
- `GET /budget/targets/{period}` -> OK
- `POST /budget/targets/{period}` -> upsert OK

## Frontend Checks (HTTPS)

- `/signin` -> login -> redirect `/dashboard` via cookies
- `/dashboard`, `/crm`, `/activities`, `/calendar` stable, no console CORS/cookie warnings
- `/budget` shows CRM-derived numbers; manual targets override when set

## Infrastructure

- Reverse proxy (choose one):

Nginx:

```
server {
    listen 80;
    server_name app.marketingkreis.ch;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl http2;
    server_name app.marketingkreis.ch;

    ssl_certificate /etc/letsencrypt/live/app.marketingkreis.ch/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.marketingkreis.ch/privkey.pem;

    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
    }

    location / {
        proxy_pass http://127.0.0.1:3000/;
    }
}
```

Caddy:

```
app.marketingkreis.ch {
  encode gzip zstd
  @api path /api/*
  handle @api {
    reverse_proxy 127.0.0.1:8000
  }
  handle {
    reverse_proxy 127.0.0.1:3000
  }
}
```

- Process manager:
  - Backend (systemd):

```
[Unit]
Description=MarketingKreis Backend
After=network.target

[Service]
WorkingDirectory=/opt/marketingkreis/backend
Environment=ENVIRONMENT=production
EnvironmentFile=/opt/marketingkreis/backend/.env.production
ExecStart=/opt/marketingkreis/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

  - Frontend (systemd):

```
[Unit]
Description=MarketingKreis Frontend
After=network.target

[Service]
WorkingDirectory=/opt/marketingkreis/frontend
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

## Recommendations (Next steps)

- CI/CD: GitHub Actions to build, run tests, publish artifacts, and deploy via SSH/rsync or Docker
- Observability: Sentry for FE/BE, structured logging, uptime monitoring (Healthchecks/Prometheus)
- Backups: pg_dump nightly, secure storage (S3)
- Security: rotate JWT & CSRF secrets quarterly, enable DB TLS if remote
- Performance: add caching headers on static assets via proxy, DB indexes for CRM filters

## Final Confirmation

✅ Production setup complete
✅ Backend and frontend fully functional under HTTPS
✅ CRM, Budget, Calendar, Activities pages verified
✅ All systems stable and production-ready

