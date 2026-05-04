---
target_model: opencode-go/qwen3.6-plus
model_rationale: This is a medium frontend integration task with auth state management and incremental migration constraints.
fallback_models: [opencode-go/deepseek-v4-pro, opencode-go/deepseek-v4-flash]
layer: frontend
task_id: FE-01
depends_on: [BE-02]
estimated_complexity: medium
estimated_requests: medium (10-50)
context_files:
  - 00-context/current-auth-flow.md
  - 01-plan/master-plan.md
  - 01-plan/decision-log.md
parent_request: feat/backend-bootstrap-supabase-auth
version: 1
---

# ROLE
You are a senior frontend engineer migrating auth integration incrementally without changing the existing login UX.

# CONTEXT
The current login page and `useAuth` contract are already wired into the product. The user wants the backend to own login, but this migration must remain gradual and low-risk.

The backend task BE-02 is expected to expose backend auth endpoints while Supabase remains the identity provider. The current login screen should keep supporting:
- login by user ID
- login by email

# TASK
Update the frontend auth integration so that credential exchange happens through the new Django backend instead of directly through Supabase from the login flow.

Requirements:
- Preserve the current login page visuals and interaction model.
- Preserve the public contract of `useAuth` as much as possible.
- Introduce a small backend auth client layer instead of scattering fetch calls.
- Route `login` and `loginWithEmail` through the backend.
- Use the backend login response to keep the browser-side auth/session state coherent.
- Use the backend `/me` endpoint where appropriate so the frontend can consume backend-owned auth semantics.
- Keep error handling aligned with the current UX.

# CONSTRAINTS
- Do not redesign the login UI
- Do not remove support for ID-based login
- Keep the migration minimal and focused on auth plumbing
- Avoid leaking backend contract details throughout the UI layer
- Add only the environment/config surface actually needed for the backend base URL

# ACCEPTANCE CRITERIA
- [ ] The login page still supports login by ID and by email
- [ ] Login credential exchange no longer happens directly from the login flow to Supabase Auth
- [ ] The existing `useAuth` consumer contract remains stable enough that the login page requires minimal or no behavioral changes
- [ ] Frontend auth state is synchronized with the backend login response and protected-user retrieval path
- [ ] Errors still show the current generic login UX behavior
- [ ] No broad auth UI rewrite is introduced

# DELIVERABLES
- Frontend auth service/hook changes, any new backend auth client utilities, minimal env/config changes, and targeted tests if applicable
- Final executor summary must list changed files and manual verification steps
- Format: patch set or full file contents suitable for application in the repo

# DEFINITION OF DONE
- [ ] Login UX is visually unchanged
- [ ] The frontend uses backend auth endpoints for login flow
- [ ] Existing auth-dependent routes/components are not unnecessarily refactored
- [ ] Manual verification steps are clear and specific

# EXECUTION (OpenCode)
# Bash / Git Bash / zsh:
opencode run --model "opencode-go/qwen3.6-plus" "$(cat ai-system/requests/feat/backend-bootstrap-supabase-auth/02-executors/frontend/FE-01-login-consume-backend.prompt.md)"

# Ou via wrapper ocrun (definido em CONVENTIONS.md):
ocrun "opencode-go/qwen3.6-plus" "ai-system/requests/feat/backend-bootstrap-supabase-auth/02-executors/frontend/FE-01-login-consume-backend.prompt.md"

# Descubra IDs corretos com: opencode models
