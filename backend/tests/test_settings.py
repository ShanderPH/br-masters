from django.conf import settings


def test_core_app_is_installed():
    assert "apps.core" in settings.INSTALLED_APPS


def test_auth_app_is_installed():
    assert "apps.authentication" in settings.INSTALLED_APPS


def test_rest_framework_is_configured():
    assert "rest_framework" in settings.INSTALLED_APPS
    renderers = settings.REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"]
    assert "rest_framework.renderers.JSONRenderer" in renderers


def test_django_celery_beat_is_installed():
    assert "django_celery_beat" in settings.INSTALLED_APPS
