# BR Masters API

Django REST Framework backend for BR Masters.

## Prerequisites

- Python 3.14+
- Redis (for Celery)
- PostgreSQL (Supabase or any Postgres instance)

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # or .venv\Scripts\activate on Windows
pip install -e ".[dev]"
```

## Environment Variables

Create a `backend/.env` file or set in your shell:

| Variable | Default | Description |
|---|---|---|
| `DJANGO_SECRET_KEY` | insecure-dev-key... | Django secret key |
| `DJANGO_DEBUG` | `False` | Enable debug mode |
| `DJANGO_ALLOWED_HOSTS` | `localhost,127.0.0.1` | Comma-separated hosts |
| `POSTGRES_DB` | `br_masters` | Database name |
| `POSTGRES_USER` | `postgres` | Database user |
| `POSTGRES_PASSWORD` | `` | Database password |
| `POSTGRES_HOST` | `localhost` | Database host |
| `POSTGRES_PORT` | `5432` | Database port |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated origins |
| `CELERY_BROKER_URL` | `redis://localhost:6379/0` | Redis broker URL |
| `CELERY_RESULT_BACKEND` | `redis://localhost:6379/0` | Redis result backend |
| `SUPABASE_URL` | `` | Supabase project URL |
| `SUPABASE_ANON_KEY` | `` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | `` | Supabase service role key |
| `SUPABASE_JWT_ISSUER` | `` | Supabase JWT issuer URL |
| `SUPABASE_JWT_AUDIENCE` | `authenticated` | Supabase JWT audience |

See `backend/.env.example` for a template.

## Run

```bash
# Django development server
python manage.py runserver

# Celery worker
celery -A celery_app worker --loglevel=info

# Celery beat
celery -A celery_app beat --loglevel=info
```

## Tests

```bash
pytest
```

## Lint

```bash
ruff check .
ruff format .
```

## Railway Deployment

See [RAILWAY.md](RAILWAY.md) for deployment instructions.

The backend runs as three separate Railway services:

| Service | Command |
|---|---|
| Web | `bash scripts/entrypoint.sh` (with `RAILWAY_PROCESS_TYPE=web`) |
| Worker | `bash scripts/entrypoint.sh` (with `RAILWAY_PROCESS_TYPE=worker`) |
| Beat | `bash scripts/entrypoint.sh` (with `RAILWAY_PROCESS_TYPE=beat`) |
