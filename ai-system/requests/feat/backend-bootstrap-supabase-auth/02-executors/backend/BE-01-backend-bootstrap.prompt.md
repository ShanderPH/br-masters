---
target_model: opencode-go/deepseek-v4-flash
model_rationale: Bootstrap and scaffolding work is mostly deterministic and file-heavy, so Flash is the most cost-efficient starting point.
fallback_models: [opencode-go/qwen3.6-plus, opencode-go/deepseek-v4-pro]
layer: backend
task_id: BE-01
depends_on: []
estimated_complexity: medium
estimated_requests: medium (10-50)
context_files:
  - 00-context/current-auth-flow.md
  - 00-context/external-doc-notes.md
  - 01-plan/master-plan.md
  - 01-plan/decision-log.md
parent_request: feat/backend-bootstrap-supabase-auth
version: 1
---

# ROLE
You are a senior Django platform engineer bootstrapping a production-ready API foundation inside an existing monorepo.

# CONTEXT
The repository currently contains a Next.js frontend that already uses Supabase directly for authentication. A tiny Python stub exists under `services/api/main.py`, but there is no Django backend yet. You must create a new backend foundation under `backend/` without breaking the current frontend.

The user explicitly chose:
- Python 3.14
- Django + Django REST Framework
- Backend-owned login integrated with Supabase Auth

The backend must be ready for future domain expansion and background processing.

# TASK
Create the initial backend scaffold under `backend/`.

Implement a Django project structure suitable for an API-first service with the following minimum capabilities:
- dependency/project metadata via `pyproject.toml`
- `manage.py`
- Django project package with ASGI and WSGI entrypoints
- split settings modules (`base.py`, `local.py`, `production.py`)
- environment-driven configuration
- Django REST Framework installed and configured
- a core app for shared infrastructure concerns
- an auth-oriented app namespace ready for future work
- a health endpoint intended for local verification and Railway health checks
- Celery application bootstrap wired to Django settings
- a small smoke test suite proving the project starts and the health endpoint works
- concise backend README instructions for local bootstrapping

# CONSTRAINTS
- Stack: Python 3.14, Django, Django REST Framework, Celery, Redis-ready configuration
- Keep the backend rooted under `backend/`
- Do not implement the Supabase login endpoints in this task
- Do not modify the current frontend in this task
- Do not introduce business-domain models beyond what is required for framework bootstrap
- Keep configuration explicit and suitable for Railway deployment later
- Prefer maintainable structure over minimizing file count

# ACCEPTANCE CRITERIA
- [ ] `backend/` contains a valid Django project with `manage.py`
- [ ] Settings are split by environment and can be selected via environment variables
- [ ] DRF is installed and configured
- [ ] A health endpoint returns a simple success payload and HTTP 200
- [ ] Celery bootstrap exists and is importable without hacks
- [ ] Tests cover at least the health endpoint and a basic settings/app boot smoke check
- [ ] A backend README explains how to install deps, set env vars, run the server, and run tests
- [ ] No frontend files are changed

# DELIVERABLES
- Create/modify only backend bootstrap files and any minimal root-level config references strictly required by that bootstrap
- Include the exact files created/modified in the final executor summary
- Format: full file contents or patch set suitable for application in the repo

# DEFINITION OF DONE
- [ ] Lint/style choices are consistent within the backend files created
- [ ] Startup path is clear for local development
- [ ] Test commands are included and runnable
- [ ] No placeholder TODO/FIXME/debug print leftovers remain
- [ ] The backend foundation is ready for BE-02 to add real auth behavior

# EXECUTION (OpenCode)
# Bash / Git Bash / zsh:
opencode run --model "opencode-go/deepseek-v4-flash" "$(cat ai-system/requests/feat/backend-bootstrap-supabase-auth/02-executors/backend/BE-01-backend-bootstrap.prompt.md)"

# Ou via wrapper ocrun (definido em CONVENTIONS.md):
ocrun "opencode-go/deepseek-v4-flash" "ai-system/requests/feat/backend-bootstrap-supabase-auth/02-executors/backend/BE-01-backend-bootstrap.prompt.md"

# Descubra IDs corretos com: opencode models
