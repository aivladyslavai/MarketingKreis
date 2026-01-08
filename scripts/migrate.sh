#!/usr/bin/env bash
set -euo pipefail

# Run Alembic migrations for the Python backend.
# Usage:
#   ./scripts/migrate.sh           # uses backend/.env.development by default
#   ENVIRONMENT=production ./scripts/migrate.sh   # uses backend/.env.production

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR/backend"

if [[ "${ENVIRONMENT:-development}" == "production" ]]; then
  export ENVIRONMENT=production
else
  export ENVIRONMENT=development
fi

alembic upgrade head

