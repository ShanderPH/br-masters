# Deploy Plan — feat/backend-bootstrap-supabase-auth

## 1) Deployment Objective

Release the backend bootstrap + Supabase-auth login flow to production with controlled risk, preserving the current frontend UX and enabling backend-owned authentication.

## 2) Release Gates (must be green before deploy)

- QA report `QA-01-auth-bootstrap-report.md` is **APPROVED** (10/10 pass, 18/18 tests).
- Frontend lint is green (`npm run lint`).
- Frontend production build is green (`npm run build`).
- Backend local quality checks are green (`pytest`, `ruff check .`, `ruff format --check .`).
- Required environment variables are available in target Railway services.

## 3) GitHub Runbook

### 3.1 Branch and PR hygiene

1. Ensure working branch is `feat/backend-bootstrap-supabase-auth`.
2. Push latest branch state.
3. Open or update PR to `main` with:
   - Scope summary (BE-01, OPS-01, BE-02, FE-01)
   - QA evidence link (`04-orchestrator-feedback/QA-01-auth-bootstrap-report.md`)
   - Risk notes (env vars, Railway multi-service config)
   - Rollback strategy (revert commit + Railway rollback)

### 3.2 Required checks on PR

- Frontend CI (lint/build/test if configured) ✅
- Backend CI (pytest/ruff if configured) ✅
- Manual verification note attached (login by ID/email + `/api/v1/auth/me`) ✅

### 3.3 Merge strategy

- Prefer **Squash and Merge** for a clean revert path.
- Tag release after merge: `backend-auth-bootstrap-v1` (or team naming standard).
- Keep PR description as release notes seed.

## 4) Railway Runbook (Web → Worker → Beat)

Source of truth: `backend/RAILWAY.md`.

### 4.1 Services topology

Create/confirm 3 services from same repo and same commit:

- `br-masters-web`
- `br-masters-worker`
- `br-masters-beat`

For all three:
- Root Directory: `backend`
- Build Command: `pip install -e .`
- Start Command: `bash scripts/entrypoint.sh`

### 4.2 Service-specific process type

- Web: `RAILWAY_PROCESS_TYPE=web`
- Worker: `RAILWAY_PROCESS_TYPE=worker`
- Beat: `RAILWAY_PROCESS_TYPE=beat`

### 4.3 Mandatory shared environment variables

- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG=False`
- `DJANGO_SETTINGS_MODULE=config.settings.production`
- `DJANGO_ALLOWED_HOSTS` (include Railway domain and custom domain)
- `POSTGRES_HOST`
- `POSTGRES_PORT=5432`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_ISSUER`
- `CELERY_BROKER_URL`
- `CELERY_RESULT_BACKEND`
- `CORS_ALLOWED_ORIGINS` (include production frontend URL)

Optional tuning:
- `WEB_WORKERS`
- `WEB_THREADS`
- `CELERY_LOG_LEVEL`
- `CELERY_WORKER_CONCURRENCY`
- `CELERY_WORKER_POOL`

### 4.4 Infrastructure dependencies

- Redis provisioned and linked to all 3 services.
- Postgres connection validated (Supabase Postgres or Railway Postgres).

### 4.5 Ordered rollout sequence

1. Deploy **web** first.
2. Confirm web boot, migrations/static prestart behavior, and health check (`/api/health/` returns 200).
3. Deploy **worker**.
4. Confirm worker is connected to Redis and consuming queue without crash loops.
5. Deploy **beat**.
6. Confirm beat scheduler startup without errors.

## 5) Smoke Test Checklist (post-deploy)

Run in production/staging-safe test account:

1. `GET /api/health/` returns 200 with expected payload.
2. Login with email/password succeeds and returns session tokens.
3. Login with identifier (`firebase_id`) succeeds.
4. Invalid credentials return safe 401 (no sensitive leakage).
5. `GET /api/v1/auth/me` with valid bearer token returns app user.
6. `GET /api/v1/auth/me` with invalid/expired token returns 401.
7. Frontend `/login` still works in both tabs (ID and Email) with unchanged UX.

## 6) Monitoring During Rollout (first 30–60 min)

- Railway logs:
  - web: startup, DB connectivity, Supabase auth calls
  - worker: broker connectivity, task execution
  - beat: scheduler heartbeat
- Error tracking (if enabled): auth endpoint exceptions, JWT validation errors, CORS failures.
- User-facing metrics: login success rate, auth-related 4xx/5xx spikes.

## 7) Rollback Plan

## 7.1 Trigger conditions

Rollback if any of the following occurs:
- Health endpoint unstable or non-200 after stabilization window.
- Login failure rate spikes significantly.
- `/me` endpoint consistently failing for valid sessions.
- Worker/beat crash loops affecting platform stability.

## 7.2 Rollback actions

1. In Railway, redeploy previous stable release for web/worker/beat.
2. In GitHub, revert merge commit from `main`.
3. Re-run smoke checks on rolled-back version.
4. Open incident note in `04-orchestrator-feedback/` with root-cause hypothesis and reroute target.

## 8) Final Deployment Evidence (to archive)

Store these artifacts in request history before marking DONE:
- PR URL + merge commit SHA
- Railway deploy IDs / logs screenshots
- Smoke test execution notes
- Any deviations from planned env config
- Rollback not needed confirmation (or executed rollback report)
