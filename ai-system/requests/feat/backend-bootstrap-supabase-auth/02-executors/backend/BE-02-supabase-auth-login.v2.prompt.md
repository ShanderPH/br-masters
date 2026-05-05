---
target_model: opencode-go/deepseek-v4-pro
model_rationale: Production hot-reroute affecting dependency graph and deployment stability requires precise multi-file backend fix with validation steps.
fallback_models: [opencode-go/qwen3.6-plus, opencode-go/deepseek-v4-flash]
layer: backend
task_id: BE-02
depends_on: [BE-02]
estimated_complexity: medium
estimated_requests: medium (10-50)
context_files:
  - ai-system/requests/feat/backend-bootstrap-supabase-auth/04-orchestrator-feedback/QA-01-auth-bootstrap-report.md
  - backend/pyproject.toml
  - backend/config/settings/base.py
  - backend/scripts/entrypoint.sh
  - backend/RAILWAY.md
parent_request: feat/backend-bootstrap-supabase-auth
version: 2
---

# ROLE
You are a senior Django/Celery production engineer fixing a post-deploy crash in Railway with minimal, safe changes.

# CONTEXT
Production deployment status:
- `web` and `worker` services are online.
- `beat` service crashes and restarts in loop.
- Railway logs show:
  - `ModuleNotFoundError: No module named 'django_celery_beat'`
  - Crash happens when beat starts with scheduler `django_celery_beat.schedulers:DatabaseScheduler`.

Current backend behavior:
- `backend/scripts/entrypoint.sh` starts beat with:
  - `celery -A celery_app beat --scheduler=django_celery_beat.schedulers:DatabaseScheduler`
- `backend/pyproject.toml` currently does not include `django-celery-beat`.
- `backend/config/settings/base.py` currently does not include `django_celery_beat` in `INSTALLED_APPS`.

# TASK
Apply a focused reroute fix to stop beat crash in Railway and keep scheduler architecture consistent with the existing design.

Implement the following:
1. Add `django-celery-beat` to runtime dependencies in `backend/pyproject.toml`.
2. Add `django_celery_beat` to `INSTALLED_APPS` in `backend/config/settings/base.py`.
3. Keep `backend/scripts/entrypoint.sh` scheduler command unchanged unless strictly needed.
4. Update `backend/RAILWAY.md` troubleshooting/notes minimally to mention required migration for `django_celery_beat` tables before starting beat (if not already explicit).
5. Add or adjust backend test coverage only if there is an existing lightweight place for settings/import validation. Do not overbuild.

# CONSTRAINTS
- Stack: Python 3.14, Django, Celery, Railway.
- Keep change minimal and surgical (no unrelated refactors).
- Do not alter frontend files.
- Do not downgrade Python or core dependencies.
- Preserve existing deployment topology: web -> worker -> beat.

# ACCEPTANCE CRITERIA
- [ ] `backend/pyproject.toml` includes `django-celery-beat` in runtime dependencies.
- [ ] `backend/config/settings/base.py` includes `django_celery_beat` in `INSTALLED_APPS`.
- [ ] Local import path for scheduler is valid (no `ModuleNotFoundError` risk).
- [ ] Documentation clarifies that migrations must be applied before stable beat startup.
- [ ] No unrelated file churn.

# DELIVERABLES
- Modified files only:
  - `backend/pyproject.toml`
  - `backend/config/settings/base.py`
  - `backend/RAILWAY.md` (only if needed)
  - Optional tiny test adjustment if existing pattern supports it
- Provide unified diff and short execution notes.

# DEFINITION OF DONE
- [ ] `ruff check .` passes in backend scope
- [ ] `pytest` passes for backend suite
- [ ] `python manage.py migrate --check` has no missing migrations state after generation/application workflow
- [ ] No TODO/FIXME/debug leftovers
- [ ] Fix ready for Railway redeploy validation

# EXECUTION (OpenCode)
# Bash / Git Bash / zsh:
opencode run --model "opencode-go/deepseek-v4-pro" "$(cat ai-system/requests/feat/backend-bootstrap-supabase-auth/02-executors/backend/BE-02-supabase-auth-login.v2.prompt.md)"

# Ou via wrapper ocrun (definido em CONVENTIONS.md):
ocrun "opencode-go/deepseek-v4-pro" "ai-system/requests/feat/backend-bootstrap-supabase-auth/02-executors/backend/BE-02-supabase-auth-login.v2.prompt.md"

# Descubra IDs corretos com: opencode models
