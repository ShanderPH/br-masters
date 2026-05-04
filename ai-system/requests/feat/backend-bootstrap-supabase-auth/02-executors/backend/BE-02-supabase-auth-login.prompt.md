---
target_model: opencode-go/deepseek-v4-pro
model_rationale: This task mixes auth logic, token handling, API design, and integration detail, which benefits from stronger reasoning.
fallback_models: [opencode-go/qwen3.6-plus, opencode-go/deepseek-v4-flash]
layer: backend
task_id: BE-02
depends_on: [BE-01]
estimated_complexity: high
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
You are a senior backend engineer implementing authentication endpoints in Django while keeping Supabase Auth as the identity provider.

# CONTEXT
The current frontend supports two login modes:
- username/ID + password
- email + password

Today, the frontend resolves username/ID to an email via `public.users` + `public.user_profiles`, then calls Supabase Auth directly from the browser. This task moves credential verification to Django.

Supabase remains the identity source of truth. The Django backend must not become the password authority and must not create a parallel local-auth system.

# TASK
Implement the first backend auth feature set in Django:
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- optionally `POST /api/v1/auth/logout` only if it is clean and justified by the chosen token/session approach

Behavior requirements:
1. Support login by **email + password**.
2. Support login by **current user ID / firebase_id + password**.
3. For ID-based login, resolve the matching email using the existing app data model semantics already used by the frontend.
4. Authenticate against Supabase Auth using Python server-side integration.
5. Return a response shape that includes:
   - success state
   - authenticated app user payload needed by the frontend
   - Supabase session tokens required for the frontend session bridge
6. Implement a protected `/me` endpoint that validates a Supabase JWT and returns the current app user payload.
7. Build the implementation so that future protected Django APIs can reuse the same JWT authentication class / permission path.

# CONSTRAINTS
- Stack: Django, DRF, Supabase Python integration, JWT verification using Supabase JWKS when applicable
- Do not store passwords in Django models
- Do not switch identity ownership away from Supabase
- Do not break the existing username/ID login concept
- Keep response contracts explicit and serializer-driven
- Use service boundaries/helpers instead of putting all logic in views
- Handle invalid credentials and invalid tokens cleanly
- Prefer testable code over clever shortcuts

# ACCEPTANCE CRITERIA
- [ ] Email login authenticates against Supabase and returns session tokens plus app user payload
- [ ] Username/ID login resolves the current mapping and authenticates correctly against Supabase
- [ ] Invalid credentials return a safe error response without leaking internals
- [ ] `/api/v1/auth/me` rejects invalid/missing tokens and returns the correct current app user for valid tokens
- [ ] JWT validation is implemented in reusable backend auth code, not duplicated inside a single view
- [ ] Tests cover email login, ID login, invalid login, valid `/me`, and invalid `/me`
- [ ] The backend remains the auth entrypoint while Supabase remains the identity provider

# DELIVERABLES
- Backend auth app files, serializers, views/viewsets, services, permissions/authentication helpers, URLs, tests, and any required settings/env adjustments
- Final executor summary must list all touched files and exact test commands
- Format: full file contents or patch set suitable for application in the repo

# DEFINITION OF DONE
- [ ] Code is organized into reusable auth components
- [ ] No credential handling logic is duplicated unnecessarily
- [ ] Tests cover the primary and negative scenarios
- [ ] No local Django password/session authority is introduced by accident
- [ ] Output is ready for FE-01 to consume without requiring a UI redesign

# EXECUTION (OpenCode)
# Bash / Git Bash / zsh:
opencode run --model "opencode-go/deepseek-v4-pro" "$(cat ai-system/requests/feat/backend-bootstrap-supabase-auth/02-executors/backend/BE-02-supabase-auth-login.prompt.md)"

# Ou via wrapper ocrun (definido em CONVENTIONS.md):
ocrun "opencode-go/deepseek-v4-pro" "ai-system/requests/feat/backend-bootstrap-supabase-auth/02-executors/backend/BE-02-supabase-auth-login.prompt.md"

# Descubra IDs corretos com: opencode models
