from .base import *  # noqa: F403, F405

DEBUG = True

ALLOWED_HOSTS = ["*"]

INSTALLED_APPS += [  # noqa: F405
    "django.contrib.admin",
]

CELERY_TASK_ALWAYS_EAGER = True
