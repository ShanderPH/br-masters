# Railway Deployment Guide

## Overview

The backend is deployed to Railway as **three separate services** sharing the same codebase:

| Service | Process Type | Start Command | Purpose |
|---|---|---|---|
| `br-masters-web` | `web` | `bash scripts/entrypoint.sh` | HTTP API (Gunicorn) |
| `br-masters-worker` | `worker` | `bash scripts/entrypoint.sh` | Celery task worker |
| `br-masters-beat` | `beat` | `bash scripts/entrypoint.sh` | Celery periodic task scheduler |

The `RAILWAY_PROCESS_TYPE` environment variable controls which process runs.

## Prerequisites

- Railway account connected to this GitHub repository
- PostgreSQL database (Supabase or Railway Postgres)
- Redis database (Railway Redis or external provider)
- Supabase project with Auth enabled

## Railway Service Setup

### 1. Create three services from the same repository

For each service, set the **Root Directory** to `backend`.

### 2. Web Service (`br-masters-web`)

**Settings:**
- Root Directory: `backend`
- Build Command: `pip install -e .`
- Start Command: `bash scripts/entrypoint.sh`

**Environment Variables:**
| Variable | Value |
|---|---|
| `RAILWAY_PROCESS_TYPE` | `web` |
| `DJANGO_SECRET_KEY` | *(generate a secure key)* |
| `DJANGO_DEBUG` | `False` |
| `DJANGO_ALLOWED_HOSTS` | `*.railway.app,your-domain.com` |
| `DJANGO_SETTINGS_MODULE` | `config.settings.production` |
| `POSTGRES_HOST` | *(from Railway Postgres or Supabase)* |
| `POSTGRES_PORT` | `5432` |
| `POSTGRES_DB` | *(from Railway Postgres or Supabase)* |
| `POSTGRES_USER` | *(from Railway Postgres or Supabase)* |
| `POSTGRES_PASSWORD` | *(from Railway Postgres or Supabase)* |
| `SUPABASE_URL` | `https://your-project.supabase.co` |
| `SUPABASE_ANON_KEY` | *(from Supabase dashboard)* |
| `SUPABASE_SERVICE_ROLE_KEY` | *(from Supabase dashboard)* |
| `SUPABASE_JWT_ISSUER` | `https://your-project.supabase.co/auth/v1` |
| `CELERY_BROKER_URL` | `redis://default:password@redis-host:6379` |
| `CELERY_RESULT_BACKEND` | `redis://default:password@redis-host:6379` |
| `CORS_ALLOWED_ORIGINS` | `https://your-frontend-domain.com` |

**Healthcheck:**
- Path: `/api/health/`
- Expected status: `200`

### 3. Worker Service (`br-masters-worker`)

**Settings:**
- Root Directory: `backend`
- Build Command: `pip install -e .`
- Start Command: `bash scripts/entrypoint.sh`

**Environment Variables:**
Same as web service, except:
| Variable | Value |
|---|---|
| `RAILWAY_PROCESS_TYPE` | `worker` |

### 4. Beat Service (`br-masters-beat`)

**Settings:**
- Root Directory: `backend`
- Build Command: `pip install -e .`
- Start Command: `bash scripts/entrypoint.sh`

**Environment Variables:**
Same as web service, except:
| Variable | Value |
|---|---|
| `RAILWAY_PROCESS_TYPE` | `beat` |

### 5. Redis Provisioning

Provision a Redis service in Railway and link it to all three backend services. Set:
- `CELERY_BROKER_URL`
- `CELERY_RESULT_BACKEND`

to the Redis connection string provided by Railway.

### 6. Database Provisioning

Either:
- Use your existing **Supabase Postgres** instance, or
- Provision a new **Railway Postgres** and link it to all three services

Set the `POSTGRES_*` variables accordingly.

## Build Configuration

The `backend/Dockerfile` uses a multi-stage build:
1. **builder** stage: installs Python dependencies
2. **runtime** stage: copies installed packages and application code

Railway will auto-detect the Dockerfile in the `backend/` root directory when the Root Directory is set correctly.

## Deployment Order

1. Provision PostgreSQL and Redis
2. Deploy web service (runs migrations via prestart hook if configured)
3. Deploy worker service
4. Deploy beat service

## Local Verification Before Deploy

```bash
cd backend

# 1. Install dependencies
pip install -e ".[dev]"

# 2. Run tests
pytest

# 3. Run lint
ruff check .
ruff format --check .

# 4. Start services locally (requires Redis running)
# Terminal 1: Web
DJANGO_SETTINGS_MODULE=config.settings.local python manage.py runserver

# Terminal 2: Worker
celery -A celery_app worker --loglevel=info

# Terminal 3: Beat
celery -A celery_app beat --loglevel=info
```

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| `Connection refused` on Postgres | Wrong `POSTGRES_HOST` | Verify Railway variable reference |
| `Connection refused` on Redis | Redis not provisioned or wrong URL | Check `CELERY_BROKER_URL` |
| `DisallowedHost` | Missing domain in `DJANGO_ALLOWED_HOSTS` | Add your Railway domain |
| Worker not picking up tasks | Broker URL mismatch | Verify Redis URL is identical across services |
| Beat not scheduling / `ModuleNotFoundError` | Database scheduler not configured | Ensure `django-celery-beat` is installed and migrations run |
| `django_celery_beat` tables missing | Migrations not applied before beat startup | Run `python manage.py migrate` for the web service before deploying or restarting beat |
