# REROUTE Analysis — BE-02 Beat Crash

## Incident
- Environment: Railway production
- Affected service: `beat`
- Symptom: service enters restart loop after startup
- Key error: `ModuleNotFoundError: No module named 'django_celery_beat'`

## Root Cause Hypothesis (confirmed by logs + code scan)
1. Beat startup command uses Django Celery Beat scheduler:
   - `--scheduler=django_celery_beat.schedulers:DatabaseScheduler`
2. Project runtime dependencies do not include `django-celery-beat`.
3. Django `INSTALLED_APPS` does not include `django_celery_beat`.

Result: import fails at beat bootstrap, causing crash loop.

## Scope of Fix
- Layer: backend
- Task reroute target: `BE-02`
- Prompt version: `v2`
- Expected files touched:
  - `backend/pyproject.toml`
  - `backend/config/settings/base.py`
  - optional minimal docs note in `backend/RAILWAY.md`

## Validation Plan After Fix
1. Build/redeploy web service first (ensures dependency in image + migrations path).
2. Redeploy worker.
3. Redeploy beat.
4. Confirm beat remains stable (>10 min) and no `ModuleNotFoundError` in logs.

## Risk
- Low/medium. Dependency + app registration only.
- Main operational risk is forgetting migration ordering before beat startup.
