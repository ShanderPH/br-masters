# REROUTE Analysis — BE-03 Production Database Env

## Incident
- Environment: Railway production
- Affected service: `br-masters-beat`
- Error: `django.db.utils.OperationalError: connection to server at "localhost", port 5432 failed`

## Diagnosis
The previous dependency fix worked: `django_celery_beat` is now installed and imported.

The new crash occurs because `django-celery-beat` uses Django ORM and needs the Django database. Current settings default missing Postgres config to `localhost:5432`, so Railway beat tries to connect to local Postgres.

## Key Clarification
Supabase Auth and Django database config are separate concerns:
- Supabase Auth variables authenticate users/JWTs.
- Django still needs Postgres for migrations, auth/session/contenttypes, app models, and `django-celery-beat` scheduler tables.
- Supabase Postgres can be used for this, but its DB connection values must be configured in Railway.

## Required Operational Fix
Set database envs on all backend Railway services (`web`, `worker`, `beat`) using Supabase Postgres connection details.

Required:
- `DJANGO_SETTINGS_MODULE=config.settings.production`
- Either `DATABASE_URL` or split `POSTGRES_*`
- `CELERY_BROKER_URL` and `CELERY_RESULT_BACKEND` from Railway Redis internal URL

## Reroute Target
- Prompt: `02-executors/backend/BE-03-production-database-env.v1.prompt.md`
- Goal: make production config fail fast and document exact env requirements.
