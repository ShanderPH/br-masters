# External Documentation Notes

## Django
- Context source: `/django/django/5_2_6`.
- Modern Django projects should use `pyproject.toml` and standard project metadata.
- A split-settings structure is appropriate for environment-based configuration.
- The docs snapshot clearly lists Python support through 3.13 in package classifiers; Python 3.14 is a user-mandated choice and must be validated during implementation.

## Supabase Authentication
- Context sources: `/supabase/supabase`, `/supabase/supabase-py`.
- `supabase-py` supports `auth.sign_in_with_password({...})` and returns a session with `access_token` and `refresh_token`.
- Server-side protected endpoints should validate Supabase JWTs using the project's JWKS endpoint when possible.
- JWT verification parameters must include issuer `https://<project-ref>.supabase.co/auth/v1` and audience `authenticated`.
- Supabase remains the identity source of truth; the Django backend should not become the password authority.

## Railway
- Context source: `/railwayapp/docs`.
- A shared monorepo can host multiple services from the same repository.
- Different services should use different custom start commands in the Railway dashboard.
- Avoid a single global `startCommand` that forces web, worker, and beat to run the same process.
- Redis should be provisioned as a separate Railway service and wired through environment variables.

## Planning implications
- The backend should live in this repository under its own root directory.
- The backend must expose a health endpoint suitable for Railway checks.
- The bootstrap must prepare separate runnable processes for web, worker, and beat.
