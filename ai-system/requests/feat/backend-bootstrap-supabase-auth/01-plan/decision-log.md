# Decision Log

## ADR-001 — Request identity
- **Request:** `feat/backend-bootstrap-supabase-auth`
- **Type:** feature
- **Reasoning:** this is a new backend capability and foundational architecture step.

## ADR-002 — Runtime target
- **Decision:** target Python 3.14.
- **Status:** accepted by user.
- **Reasoning:** explicit product/architecture preference from the user.
- **Risk:** Django ecosystem compatibility must be validated during implementation.

## ADR-003 — Web framework
- **Decision:** use Django with Django REST Framework.
- **Status:** accepted by user.
- **Reasoning:** DRF provides a faster and cleaner API surface for auth endpoints, serializers, permissions, and future backend expansion.

## ADR-004 — Identity provider
- **Decision:** keep Supabase Auth as the source of truth for identity.
- **Status:** accepted.
- **Reasoning:** the current product already uses Supabase Auth successfully; the backend should centralize auth entrypoints, not replace the identity provider.

## ADR-005 — Login ownership
- **Decision:** the backend becomes the credential-entry layer for login.
- **Status:** accepted by user.
- **Reasoning:** this enables gradual migration from frontend-owned auth toward backend-owned APIs while preserving the existing product behavior.

## ADR-006 — Background processing
- **Decision:** use Redis + Celery worker + Celery beat from the first backend scaffold.
- **Status:** accepted.
- **Reasoning:** future integrations were explicitly anticipated, so the bootstrap must avoid a later structural rewrite.

## ADR-007 — Repository strategy
- **Decision:** create the backend inside this same repository under a dedicated root directory.
- **Status:** accepted.
- **Reasoning:** aligns with the user request and simplifies shared versioning and incremental integration with the current frontend.

## ADR-008 — Deployment topology
- **Decision:** Railway deployment will use separate services for web, worker, and beat.
- **Status:** accepted.
- **Reasoning:** this matches Railway guidance for monorepos with distinct long-running processes and avoids a single-process bottleneck.

## ADR-009 — Frontend migration constraint
- **Decision:** preserve the existing login page UX and `useAuth` contract during the first migration.
- **Status:** accepted.
- **Reasoning:** this reduces product risk and keeps the first backend milestone focused on infrastructure and auth ownership.
