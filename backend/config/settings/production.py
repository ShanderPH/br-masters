import os

from decouple import config

from .base import *  # noqa: F403, F405

DEBUG = False

# Fail fast in production if no database is configured.
# DATABASE_URL is preferred; otherwise all split POSTGRES_* vars are required.
if not config("DATABASE_URL", default=""):
    required_db_vars = ["POSTGRES_HOST", "POSTGRES_DB", "POSTGRES_USER", "POSTGRES_PASSWORD"]
    missing = [var for var in required_db_vars if not os.environ.get(var)]
    if missing:
        raise ValueError(
            "Production database configuration is missing. "
            f"Set DATABASE_URL or all of the following variables: {', '.join(missing)}"
        )

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
