---
target_model: opencode-go/deepseek-v4-pro
model_rationale: Production settings failure requires precise Django env handling and deployment documentation without changing architecture.
fallback_models: [opencode-go/qwen3.6-plus, opencode-go/minimax-m2.7]
layer: backend
task_id: BE-03
depends_on: [BE-01, BE-02]
estimated_complexity: medium
estimated_requests: medium (10-50)
context_files:
  - backend/config/settings/base.py
  - backend/config/settings/production.py
  - backend/celery_app.py
  - backend/scripts/entrypoint.sh
  - backend/.env.example
  - backend/RAILWAY.md
parent_request: feat/backend-bootstrap-supabase-auth
version: 1
---

# ROLE
You are a senior Django/Railway production engineer fixing production configuration for a Django + Celery + django-celery-beat backend deployed on Railway and using Supabase Postgres.

# CONTEXT
Current Railway `br-masters-beat` crash:
- `django_celery_beat` is now installed and loaded successfully.
- Beat starts with `django_celery_beat.schedulers.DatabaseScheduler`.
- New crash is:
  - `django.db.utils.OperationalError: connection to server at "localhost" (::1), port 5432 failed: Connection refused`
- This means Django is falling back to local Postgres settings in production.

Current code facts:
- `backend/config/settings/base.py` uses only split `POSTGRES_*` env vars.
- Missing `POSTGRES_*` makes Django default to `localhost:5432`.
- `backend/celery_app.py` defaults `DJANGO_SETTINGS_MODULE` to `config.settings.local` if the env var is not set.
- Railway services currently do not define `DATABASE_URL` or `DJANGO_SETTINGS_MODULE`.
- User uses Supabase for Auth and Supabase Postgres as DB source, not Railway Postgres.

Important architecture clarification:
- Supabase Auth does not remove the need for a Django database.
- Django models/migrations and `django-celery-beat` scheduler tables require Postgres.
- Supabase Postgres is acceptable, but connection envs must be configured for web/worker/beat.

# TASK
Make production configuration safer and clearer so Railway never silently falls back to localhost for database or local settings.

Implement minimal backend changes:
1. Update Django DB settings to support `DATABASE_URL` if present, while preserving current `POSTGRES_*` support.
2. In production settings, fail fast with a clear error if required DB config is missing instead of falling back to localhost.
3. Ensure Celery/Django production startup does not accidentally use `config.settings.local` on Railway.
4. Update `.env.example` and `RAILWAY.md` to document Supabase Postgres envs and required `DJANGO_SETTINGS_MODULE` for all services.
5. Add/adjust tests for configuration behavior if existing test structure supports it.

# CONSTRAINTS
- Do not hardcode real credentials.
- Do not switch from Supabase Postgres to Railway Postgres.
- Do not remove support for split `POSTGRES_*` env vars.
- Do not change frontend.
- Keep changes minimal and production-focused.
- Preserve web/worker/beat service topology.

# ACCEPTANCE CRITERIA
- [ ] Backend accepts a Supabase Postgres connection through either `DATABASE_URL` or split `POSTGRES_*` variables.
- [ ] Production config does not silently default to `localhost` when DB envs are missing.
- [ ] Railway docs explicitly state that `DJANGO_SETTINGS_MODULE=config.settings.production` is required for web, worker, and beat.
- [ ] Railway docs explicitly explain that Supabase Auth is not the same as Django database config.
- [ ] Railway docs list Supabase Postgres values needed by Django.
- [ ] Redis docs clarify which Railway Redis URL to use for `CELERY_BROKER_URL` and `CELERY_RESULT_BACKEND`.
- [ ] No secrets are committed.

# DELIVERABLES
Expected files to modify:
- `backend/config/settings/base.py`
- `backend/config/settings/production.py`
- `backend/.env.example`
- `backend/RAILWAY.md`
- optional lightweight tests under `backend/tests/`

# DEFINITION OF DONE
- [ ] `ruff check .` passes in backend scope.
- [ ] Backend tests pass if test runner is available.
- [ ] Executor provides exact Railway variable checklist for `web`, `worker`, and `beat`.
- [ ] Executor provides manual migration/redeploy order.

# EXECUTION (OpenCode)
# Bash / Git Bash / zsh:
opencode run --model "opencode-go/deepseek-v4-pro" "$(cat ai-system/requests/feat/backend-bootstrap-supabase-auth/02-executors/backend/BE-03-production-database-env.v1.prompt.md)"

# Ou via wrapper ocrun (definido em CONVENTIONS.md):
ocrun "opencode-go/deepseek-v4-pro" "ai-system/requests/feat/backend-bootstrap-supabase-auth/02-executors/backend/BE-03-production-database-env.v1.prompt.md"

# Descubra IDs corretos com: opencode models
