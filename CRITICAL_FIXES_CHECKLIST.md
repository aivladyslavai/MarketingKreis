# 🚨 Critical Fixes Checklist

**Before deploying to production, complete ALL items below.**

---

## ✅ Phase 1: Security (CRITICAL - 2 days)

### 1.1 Generate Strong Secrets
```bash
# Generate JWT secret
python3 -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_urlsafe(64))"

# Generate CSRF secret
python3 -c "import secrets; print('CSRF_SECRET=' + secrets.token_urlsafe(32))"

# Generate PostgreSQL password
python3 -c "import secrets; print('POSTGRES_PASSWORD=' + secrets.token_urlsafe(32))"
```

**Update `env.production` with generated values.**

- [ ] JWT_SECRET_KEY replaced
- [ ] POSTGRES_PASSWORD replaced
- [ ] CSRF_SECRET added
- [ ] COOKIE_DOMAIN set to your actual domain

### 1.2 Add CSRF Protection
```bash
cd backend
pip install starlette-csrf
```

**Update `backend/app/main.py`:**
```python
from starlette_csrf import CSRFMiddleware

# Add after SecurityHeadersMiddleware
app.add_middleware(
    CSRFMiddleware, 
    secret=settings.csrf_secret,
    cookie_secure=settings.cookie_secure,
    cookie_samesite=settings.cookie_samesite
)
```

**Update `backend/app/core/config.py`:**
```python
csrf_secret: str = os.getenv("CSRF_SECRET", "change-me-in-production")
```

- [ ] CSRF middleware added
- [ ] Config updated
- [ ] Tested with curl/Postman

### 1.3 Configure Sentry
```bash
# Sign up at https://sentry.io
# Create project for backend
# Create project for frontend
# Copy DSNs
```

**Update `env.production`:**
```bash
SENTRY_DSN=https://your-backend-dsn@o123456.ingest.sentry.io/7654321
NEXT_PUBLIC_SENTRY_DSN=https://your-frontend-dsn@o123456.ingest.sentry.io/7654321
SENTRY_ENV=production
```

- [ ] Backend Sentry DSN configured
- [ ] Frontend Sentry DSN configured
- [ ] Test error captured in Sentry dashboard

---

## ✅ Phase 2: Codebase Cleanup (1 day)

### 2.1 Remove Duplicate Pages
```bash
cd frontend/app
rm -rf test* *-test *-demo public-test platform-test
cd ../..
```

**Verify nothing breaks:**
```bash
cd frontend && npm run build
```

- [ ] Duplicate pages removed
- [ ] Build succeeds
- [ ] No broken links

### 2.2 Clean Temporary Files
```bash
# From project root
rm -f *.log *.pid
rm -f backend/*.log backend/*.pid
rm -f frontend/*.log frontend/*.pid
rm -f package.json.corrupted.bak
rm -rf backend/node_modules.bak.1757057799/
find backend/src -name "*.backup" -delete
```

- [ ] All log files removed
- [ ] All pid files removed
- [ ] Backup files removed

### 2.3 Organize Documentation
```bash
mkdir -p docs
mv *.md docs/ 2>/dev/null || true
mv docs/README.md . 2>/dev/null || true
```

- [ ] Docs organized in `/docs`
- [ ] README.md at root
- [ ] Update links in README

---

## ✅ Phase 3: Testing (1 week)

### 3.1 Implement Playwright E2E Tests
```bash
cd frontend
```

**Create `playwright.config.ts`:**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Create tests:**
```bash
mkdir -p tests/e2e
```

**`tests/e2e/auth.spec.ts`:**
```typescript
import { test, expect } from '@playwright/test';

test('user can register and login', async ({ page }) => {
  await page.goto('/auth/register');
  
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.fill('[name="name"]', 'Test User');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/dashboard');
});

test('invalid login shows error', async ({ page }) => {
  await page.goto('/auth/login');
  
  await page.fill('[name="email"]', 'wrong@example.com');
  await page.fill('[name="password"]', 'wrongpass');
  await page.click('button[type="submit"]');
  
  await expect(page.locator('text=Invalid credentials')).toBeVisible();
});
```

**Run tests:**
```bash
npx playwright test
```

- [ ] Playwright config created
- [ ] Auth tests written (register, login, logout)
- [ ] Dashboard tests written
- [ ] CRM tests written
- [ ] All tests pass

### 3.2 Add Frontend Unit Tests
```bash
cd frontend
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

**Create `jest.config.ts`:**
```typescript
import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({
  dir: './',
});

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};

export default createJestConfig(config);
```

**Test hooks:**
```bash
mkdir -p tests/hooks
```

- [ ] Jest configured
- [ ] Hook tests written (useAuth, useActivities, etc.)
- [ ] Component tests written
- [ ] Coverage >70%

---

## ✅ Phase 4: Infrastructure (3 days)

### 4.1 Add Nginx Reverse Proxy
```bash
mkdir -p nginx/ssl
```

**Create `nginx/nginx.conf`:**
```nginx
upstream backend {
    server backend:8000;
}

upstream frontend {
    server frontend:3000;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files (if serving from Nginx)
    location /static/ {
        alias /var/www/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Update `docker-compose.prod.yml`:**
```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
```

- [ ] Nginx config created
- [ ] SSL certificates obtained (Let's Encrypt)
- [ ] Reverse proxy tested
- [ ] Rate limiting validated

### 4.2 Add Monitoring Stack
```bash
mkdir -p monitoring
```

**Create `docker-compose.monitoring.yml`:**
```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3002:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
    restart: unless-stopped

  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - loki-data:/loki
    restart: unless-stopped

volumes:
  prometheus-data:
  grafana-data:
  loki-data:
```

**Create `monitoring/prometheus.yml`:**
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['backend:8000']

  - job_name: 'postgres'
    static_configs:
      - targets: ['db:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
```

**Start monitoring:**
```bash
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

- [ ] Prometheus collecting metrics
- [ ] Grafana dashboards configured
- [ ] Loki aggregating logs
- [ ] Alerts configured

### 4.3 Automated Backups
```bash
# Test backup script
./scripts/backup.sh

# Setup cron
crontab -e
# Add:
0 2 * * * /path/to/scripts/backup.sh >> /var/log/backup.log 2>&1
```

- [ ] Backup script tested
- [ ] Cron job configured
- [ ] Restore tested from backup
- [ ] Backups stored off-site (S3/GCS)

---

## ✅ Phase 5: Final Validation

### 5.1 Security Checklist
- [ ] All secrets replaced (no "CHANGE_ME")
- [ ] CSRF protection active
- [ ] HTTPS enforced
- [ ] Security headers validated (securityheaders.com)
- [ ] Rate limiting tested
- [ ] SQL injection tested (SQLMap)
- [ ] XSS tested (manual + automated)

### 5.2 Performance Checklist
- [ ] Lighthouse score >90
- [ ] API response time <200ms (p95)
- [ ] Frontend load time <2s
- [ ] Database queries optimized (indexes)
- [ ] Redis caching implemented

### 5.3 Deployment Checklist
- [ ] docker-compose.prod.yml tested
- [ ] All services healthy
- [ ] Nginx reverse proxy working
- [ ] SSL certificates valid
- [ ] Monitoring dashboards accessible
- [ ] Logs aggregated
- [ ] Backups automated
- [ ] Rollback procedure documented

### 5.4 Documentation Checklist
- [ ] README updated with production instructions
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Deployment guide written
- [ ] Disaster recovery plan
- [ ] Runbook for common issues

---

## 🎯 Quick Commands

### Generate All Secrets at Once
```bash
cat << 'EOF' > .env.secrets
JWT_SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(64))")
CSRF_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
POSTGRES_PASSWORD=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
GRAFANA_PASSWORD=$(python3 -c "import secrets; print(secrets.token_urlsafe(16))")
EOF
chmod 600 .env.secrets
```

### Cleanup All Temporary Files
```bash
find . -type f \( -name "*.log" -o -name "*.pid" \) ! -path "*/node_modules/*" ! -path "*/venv/*" -delete
find . -type f -name "*.backup" ! -path "*/node_modules/*" ! -path "*/venv/*" -delete
rm -rf frontend/app/{test*,*-test,*-demo}
```

### Run Full Test Suite
```bash
# Backend
cd backend && pytest tests/ -v --cov=app --cov-fail-under=80

# Frontend
cd frontend && npm test -- --coverage --coverageThreshold='{"global":{"lines":70}}'

# E2E
cd frontend && npx playwright test
```

---

## 📊 Progress Tracker

- [ ] Phase 1: Security (0/3 tasks)
- [ ] Phase 2: Cleanup (0/3 tasks)
- [ ] Phase 3: Testing (0/2 tasks)
- [ ] Phase 4: Infrastructure (0/3 tasks)
- [ ] Phase 5: Validation (0/4 checklists)

**Estimated Completion:** ___ weeks

---

## 🚀 Ready for Production When:
✅ All checklist items completed  
✅ All tests passing (unit, integration, E2E)  
✅ Security audit passed  
✅ Load testing passed (10x expected traffic)  
✅ Monitoring and alerting configured  
✅ Disaster recovery tested  

