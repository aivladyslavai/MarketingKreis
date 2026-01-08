# MarketingKreis CRM + Marketing Cockpit

Full-stack platform with FastAPI backend, Next.js + Tailwind frontend, and PostgreSQL.

## Features

- **Authentication**: JWT-based auth with role-based access (Admin, Marketing Manager, Viewer)
- **CRM Core**: Complete CRUD operations for users, activities, calendar, and performance tracking
- **Marketing Cockpit**: Interactive dashboard with calendar view, charts, and content planning
- **Data Visualization**: Soll vs Ist charts, budget allocation, leads tracking
- **Export**: PDF and CSV export capabilities
- **Responsive Design**: Modern UI with TailwindCSS

## Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: Next.js (React) + TailwindCSS + Recharts
- **Database**: PostgreSQL
- **Authentication**: JWT
- **Deployment**: Docker + Docker Compose

## Quick Start (Docker)

```bash
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Default Login

- Email: `admin@mk.local`
- Password: `admin123`

## API Highlights

- POST `/auth/login` (form: username, password)
- GET `/activities`, POST `/activities`, PUT `/activities/{id}`, DELETE `/activities/{id}`
- GET `/performance`, POST `/performance`
- GET `/calendar`, POST `/calendar`, PUT `/calendar/{id}`, DELETE `/calendar/{id}`
- POST `/uploads/preview`
- POST `/import/activities`, POST `/import/performance`
- GET `/export/activities.csv`, `/export/performance.csv`, `/export/report.pdf`

## End-to-End Tests (Playwright)

- Configure secrets in GitHub repo settings:
  - `E2E_TEST_USER` – email for the E2E user
  - `E2E_TEST_PASSWORD` – password for the E2E user
- CI will:
  - Build and start the stack with `docker compose up -d --build`
  - Wait until `http://localhost:3000` is reachable
  - Run Playwright tests with `PLAYWRIGHT_BASE_URL=http://localhost:3000`
- Locally:
  - Start the app (docker compose or scripts) so frontend is reachable at `http://localhost:3000`
  - Run `cd frontend && npm run e2e`# Marketingkreis
# Marketingkreis
