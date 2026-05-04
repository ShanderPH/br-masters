---
target_model: opencode-go/qwen3.6-plus
model_rationale: QA for multi-step auth/bootstrap integration benefits from balanced reasoning plus practical execution thinking.
fallback_models: [opencode-go/deepseek-v4-pro, opencode-go/deepseek-v4-flash]
layer: qa
task_id: QA-01
validates: [BE-01, OPS-01, BE-02, FE-01]
parent_request: feat/backend-bootstrap-supabase-auth
version: 1
---

# ROLE
Senior QA Engineer validating backend bootstrap, auth integration, and frontend login continuity.

# SCOPE
Validate the initial Django backend scaffold, Railway-oriented process bootstrap, Supabase-authenticated login endpoints, and the incremental frontend auth migration.

# TEST CASES
1. **Positive — health endpoint:** start the backend locally and verify the health endpoint returns HTTP 200 with the expected payload.
2. **Positive — email login:** authenticate with a valid email/password through the backend entrypoint and confirm session tokens + app user payload are returned.
3. **Positive — ID login:** authenticate with a valid existing user ID / `firebase_id` plus password and confirm the same success path works.
4. **Positive — current user:** call `/api/v1/auth/me` with a valid Supabase access token and verify the correct app user payload is returned.
5. **Negative — wrong password:** verify login fails safely with the expected error shape and no credential leakage.
6. **Negative — unknown ID:** verify ID-based login fails safely when the mapped user cannot be resolved.
7. **Negative — invalid token:** verify `/api/v1/auth/me` rejects malformed, expired, or invalid JWTs.
8. **Edge — missing env vars:** verify startup/auth failures are explicit when critical backend env vars are absent.
9. **Edge — process bootstrap:** verify web, worker, and beat commands are all individually runnable/importable from the documented setup.
10. **Regression — frontend login UX:** verify the login screen still supports both ID and email modes without a visual redesign.

# INTEGRATION CHECKS
- Frontend login actions call the backend instead of directly performing credential exchange with Supabase.
- Backend login still relies on Supabase as the identity provider.
- JWT validation path used by `/me` is reusable for future protected APIs.
- Railway-oriented docs/start commands match the actual backend process layout.
- The `useAuth` contract remains compatible with the login page.

# PASS CRITERIA
- [ ] All positive scenarios pass
- [ ] Invalid credentials and invalid tokens fail safely and predictably
- [ ] Bootstrap artifacts are runnable using the documented local commands
- [ ] DoD from `01-plan/master-plan.md` is materially covered

# FAIL -> ROUTE TO
- If the backend scaffold or health bootstrap fails: layer=backend, task_id=BE-01
- If Railway/process topology is unclear or broken: layer=devops, task_id=OPS-01
- If login or `/me` behavior is wrong: layer=backend, task_id=BE-02
- If the UI/auth bridge regresses: layer=frontend, task_id=FE-01
- If root cause is unclear: generate analysis in `04-orchestrator-feedback/`

# EXECUTION
# Bash / Git Bash / zsh:
opencode run --model "opencode-go/qwen3.6-plus" "$(cat ai-system/requests/feat/backend-bootstrap-supabase-auth/03-qa/QA-01-auth-bootstrap.md)"

# Ou via wrapper ocrun (definido em CONVENTIONS.md):
ocrun "opencode-go/qwen3.6-plus" "ai-system/requests/feat/backend-bootstrap-supabase-auth/03-qa/QA-01-auth-bootstrap.md"

# Descubra IDs corretos com: opencode models
