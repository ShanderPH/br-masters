import os

from celery import Celery

# Never silently fall back to local settings in production-like environments.
if "DJANGO_SETTINGS_MODULE" not in os.environ:
    if os.environ.get("RAILWAY_PROCESS_TYPE") or os.environ.get("RAILWAY_ENVIRONMENT"):
        raise RuntimeError(
            "DJANGO_SETTINGS_MODULE must be explicitly set in Railway. "
            "Use config.settings.production for all services (web, worker, beat)."
        )
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")

app = Celery("br_masters")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
