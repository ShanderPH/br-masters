---
target_model: opencode-go/qwen3.6-plus
model_rationale: Railway and process bootstrap work is terminal- and ops-oriented, which fits Qwen3.6 Plus well.
fallback_models: [opencode-go/deepseek-v4-pro, opencode-go/minimax-m2.7]
layer: devops
task_id: OPS-01
depends_on: [BE-01]
estimated_complexity: medium
estimated_requests: medium (10-50)
context_files:
  - 00-context/external-doc-notes.md
  - 01-plan/master-plan.md
  - 01-plan/decision-log.md
parent_request: feat/backend-bootstrap-supabase-auth
version: 1
---

# ROLE
You are a senior platform/devops engineer preparing a Django API service for Railway deployment inside an existing monorepo.

# CONTEXT
The new backend will live in `backend/` and must run as separate Railway services for:
- web
- worker
- beat

Redis is required for Celery. Railway monorepo guidance indicates that a shared repository can back multiple services, but service-specific start commands should remain separate instead of forcing one global start command.

# TASK
Prepare the repository for Railway-oriented backend execution.

Implement the devops/bootstrap layer needed for local consistency and Railway readiness, including:
- Dockerfile or equivalent build path for the backend service root
- startup commands/scripts for web, worker, and beat
- environment variable documentation for backend + Redis + Supabase integration
- any shared config that helps Railway build the backend from the monorepo without conflicting start commands
- developer-facing run instructions for local verification

Prefer a setup that keeps the same codebase reusable for all three Railway services while allowing distinct process commands.

# CONSTRAINTS
- Do not add a single global start command that would break multi-service deployment
- Keep deployment artifacts scoped to the backend service needs
- Do not attempt live deployment in this task
- Avoid changing the current frontend deployment path unless strictly necessary
- Keep the result understandable for future maintainers

# ACCEPTANCE CRITERIA
- [ ] The repo contains a clear build/run path for the Django web service
- [ ] Separate runnable commands exist for worker and beat
- [ ] Redis assumptions are explicit and environment-driven
- [ ] Railway usage in a monorepo is documented clearly enough to create the three services later
- [ ] No global config forces web, worker, and beat to share the same start command
- [ ] Local verification steps are documented

# DELIVERABLES
- Devops/bootstrap files under `backend/` or root only where justified, plus docs for environment variables and Railway service setup
- Final executor summary must list touched files and exact commands for web, worker, and beat
- Format: patch set or full file contents suitable for application in the repo

# DEFINITION OF DONE
- [ ] Backend process topology is explicit
- [ ] Railway service setup path is documented
- [ ] Local developers can understand how to run the backend stack
- [ ] The result is ready for a later `/deploy` planning step

# EXECUTION (OpenCode)
# Bash / Git Bash / zsh:
opencode run --model "opencode-go/qwen3.6-plus" "$(cat ai-system/requests/feat/backend-bootstrap-supabase-auth/02-executors/devops/OPS-01-railway-celery-bootstrap.prompt.md)"

# Ou via wrapper ocrun (definido em CONVENTIONS.md):
ocrun "opencode-go/qwen3.6-plus" "ai-system/requests/feat/backend-bootstrap-supabase-auth/02-executors/devops/OPS-01-railway-celery-bootstrap.prompt.md"

# Descubra IDs corretos com: opencode models
