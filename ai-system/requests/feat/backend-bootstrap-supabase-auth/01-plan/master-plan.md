# Master Plan — Backend Bootstrap + Supabase Auth Login

## Objective
Create the initial backend foundation inside this monorepo using Python 3.14, Django, Redis, Celery worker, and Celery beat, targeting Railway deployment. The first functional capability must be login handled by the backend and integrated with Supabase Authentication.

## In Scope
- Create a new `backend/` application root inside the current repository.
- Bootstrap Django project structure for API-first development.
- Add Django REST Framework for HTTP APIs.
- Add Redis-backed Celery worker and Celery beat foundation.
- Add environment-based settings and local/production configuration split.
- Add a health endpoint for service verification.
- Implement backend-owned auth endpoints for login and current-user resolution.
- Integrate login with Supabase Authentication as the identity provider.
- Preserve the existing frontend login UX while rerouting credential exchange through the backend.
- Prepare repo artifacts for Railway multi-service deployment.

## Out of Scope
- Domain migrations from the existing frontend to Django beyond auth bootstrap.
- Replacing Supabase as the identity provider.
- Rebuilding registration, forgot-password, or profile completion flows unless strictly necessary for login.
- Large frontend redesign.
- Full production deployment execution.

## Architecture Direction
- **Backend root:** `backend/`
- **Framework:** Django + Django REST Framework
- **Background processing:** Celery + Redis
- **Identity source of truth:** Supabase Auth
- **Protected API auth:** Supabase JWT verification in Django
- **Monorepo deployment target:** Railway with separate web, worker, and beat services

## Layer Decomposition

### Backend
- Bootstrap the Django project and app structure.
- Create split settings (`base`, `local`, `production`).
- Add healthcheck route.
- Add Supabase integration services.
- Add DRF auth endpoints for login and `/me`.
- Add automated tests for auth and bootstrap smoke checks.

### Frontend
- Keep the current login page and `useAuth` public contract stable.
- Replace direct credential exchange with backend API calls.
- Keep the migration incremental to avoid a broad UI refactor.

### DevOps
- Add Docker/Railway-ready startup flow for web, worker, and beat.
- Document required environment variables.
- Ensure Redis wiring and service-specific start commands are clear.

### QA
- Validate login by email and by existing user ID flow.
- Validate JWT-protected `/me` behavior.
- Validate health endpoint and process bootstrapping assumptions.

## Execution Waves

### Wave 1
- BE-01: backend bootstrap
- OPS-01: Railway + process bootstrap

### Wave 2
- BE-02: Supabase-authenticated login endpoints
- FE-01: frontend bridge to backend auth

### Wave 3
- QA-01: end-to-end validation of the bootstrap and auth flow

## Testable Acceptance Criteria
- [ ] A new `backend/` directory exists with a runnable Django project using Python 3.14 configuration.
- [ ] The backend exposes a health endpoint suitable for Railway health checks.
- [ ] Celery app, worker, and beat bootstrap are present and importable.
- [ ] The backend provides login endpoints that authenticate against Supabase Auth instead of local Django passwords.
- [ ] Username/ID login remains supported by resolving the current user mapping before password authentication.
- [ ] A protected endpoint returns the authenticated app user using validated Supabase JWTs.
- [ ] The frontend login screen can authenticate through the backend without changing its visual UX.
- [ ] Railway-oriented run commands and environment expectations are documented in-repo.

## Definition of Done
- [ ] Repo contains backend bootstrap artifacts and no placeholder-only implementation.
- [ ] Backend code is organized for future domain expansion.
- [ ] No frontend auth UI regression is introduced.
- [ ] Tests cover the main auth scenarios and at least one protected endpoint.
- [ ] Environment variables are documented without exposing secrets.
- [ ] The resulting implementation is ready for a dedicated deployment phase.

## Risks
- Python 3.14 compatibility may require dependency/version adjustments.
- Cross-origin/session handling between frontend and backend must be explicit.
- Supabase JWT verification depends on the project token configuration and JWKS availability.

## Reroute Triggers
- If Python 3.14 package compatibility blocks bootstrap, reroute to DevOps + Backend for version pinning strategy.
- If Supabase token verification differs from expected project configuration, reroute to Backend for auth adapter refinement.
- If frontend session synchronization becomes unstable, reroute to Frontend for a stricter token/session bridge.
