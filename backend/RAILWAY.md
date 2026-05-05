# Railway Deployment Guide

## Overview

The backend is deployed to Railway as **three separate services** sharing the same codebase:

| Service | Process Type | Start Command | Purpose |
|---|---|---|---|
| `br-masters-web` | `web` | `bash scripts/entrypoint.sh` | HTTP API (Gunicorn) |
| `br-masters-worker` | `worker` | `bash scripts/entrypoint.sh` | Celery task worker |
| `br-masters-beat` | `beat` | `bash scripts/entrypoint.sh` | Celery periodic task scheduler |

The `RAILWAY_PROCESS_TYPE` environment variable controls which process runs.

## Important Architecture Note

**Supabase Auth is NOT the same as Django's database.**

- Supabase Auth handles user authentication (login, JWT, etc.).
- Django still needs its **own Postgres database** for:
  - Django models and migrations
  - `django-celery-beat` scheduler tables
  - Any other application data

You can use **Supabase Postgres** as Django's database, but you must configure the connection variables below.

## Prerequisites

- Railway account connected to this GitHub repository
- Postgres database (Supabase Postgres recommended, or Railway Postgres)
- Redis database (Railway Redis recommended)
- Supabase project with Auth enabled

## Railway Service Setup

### 1. Create three services from the same repository

For each service, set the **Root Directory** to `backend`.

### 2. Web Service (`br-masters-web`)

**Settings:**
- Root Directory: `backend`
- Build Command: `pip install -e .`
- Start Command: `bash scripts/entrypoint.sh`

**Required Environment Variables:**

| Variable | Value / Example |
|---|---|
| `RAILWAY_PROCESS_TYPE` | `web` |
| `DJANGO_SETTINGS_MODULE` | `config.settings.production` **(Required for all services)** |
| `DJANGO_SECRET_KEY` | *(generate a secure key)* |
| `DJANGO_DEBUG` | `False` |
| `DJANGO_ALLOWED_HOSTS` | `*.railway.app,your-domain.com` |
| `DATABASE_URL` | `postgres://user:password@host:5432/dbname` **(preferred)** |
| **OR** `POSTGRES_HOST` | *(from Supabase or Railway Postgres)* |
| **OR** `POSTGRES_PORT` | `5432` |
| **OR** `POSTGRES_DB` | *(from Supabase or Railway Postgres)* |
| **OR** `POSTGRES_USER` | *(from Supabase or Railway Postgres)* |
| **OR** `POSTGRES_PASSWORD` | *(from Supabase or Railway Postgres)* |
| `SUPABASE_URL` | `https://your-project.supabase.co` |
| `SUPABASE_ANON_KEY` | *(from Supabase dashboard)* |
| `SUPABASE_SERVICE_ROLE_KEY` | *(from Supabase dashboard)* |
| `SUPABASE_JWT_ISSUER` | `https://your-project.supabase.co/auth/v1` |
| `CELERY_BROKER_URL` | `redis://default:password@redis-host:6379/0` |
| `CELERY_RESULT_BACKEND` | `redis://default:password@redis-host:6379/0` |
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

Provision a **Railway Redis** service and link it to all three backend services.

Use the same Redis connection string for both variables:
- `CELERY_BROKER_URL`
- `CELERY_RESULT_BACKEND`

Copy the connection string from the Railway Redis service dashboard.

### 6. Database Provisioning (Supabase Postgres)

1. In your Supabase project, go to **Project Settings > Database**.
2. Copy the **connection string** (URI format) or the individual host/port/db/user/password values.
3. Set `DATABASE_URL` (preferred) OR the split `POSTGRES_*` variables in all three Railway services.

**Note:** If using Supabase Postgres, ensure the connection allows external access and SSL if required.

## Build Configuration

The `backend/Dockerfile` uses a multi-stage build:
1. **builder** stage: installs Python dependencies
2. **runtime** stage: copies installed packages and application code

Railway will auto-detect the Dockerfile in the `backend/` root directory when the Root Directory is set correctly.

## Deployment Order

1. Provision PostgreSQL (Supabase or Railway) and Redis
2. Deploy web service
3. Run migrations (via web service shell or prestart hook): `python manage.py migrate`
4. Deploy worker service
5. Deploy beat service

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
| `Connection refused` on Postgres | `DATABASE_URL` or `POSTGRES_*` missing / wrong | Verify Railway variables; do not rely on localhost defaults |
| `RuntimeError: DJANGO_SETTINGS_MODULE must be set` | Missing `DJANGO_SETTINGS_MODULE` on Railway | Set `DJANGO_SETTINGS_MODULE=config.settings.production` on all services |
| `Connection refused` on Redis | Redis not provisioned or wrong URL | Check `CELERY_BROKER_URL` matches Railway Redis |
| `DisallowedHost` | Missing domain in `DJANGO_ALLOWED_HOSTS` | Add your Railway domain |
| Worker not picking up tasks | Broker URL mismatch | Verify Redis URL is identical across services |
| Beat not scheduling / `ModuleNotFoundError` | Database scheduler not configured | Ensure `django-celery-beat` is installed and migrations run |
| `django_celery_beat` tables missing | Migrations not applied before beat startup | Run `python manage.py migrate` for the web service before deploying or restarting beat |
