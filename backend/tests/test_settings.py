import importlib
import os
from unittest import mock

import pytest


class TestDatabaseConfiguration:
    """Ensure DATABASE_URL and POSTGRES_* variables are handled correctly."""

    @mock.patch.dict(os.environ, {"DATABASE_URL": "postgres://user:pass@host:5432/db"}, clear=True)
    def test_database_url_takes_precedence(self):
        import config.settings.base as base_settings

        importlib.reload(base_settings)

        assert base_settings.DATABASE_URL == "postgres://user:pass@host:5432/db"
        assert base_settings.DATABASES["default"]["ENGINE"] == "django.db.backends.postgresql"

    @mock.patch.dict(
        os.environ,
        {
            "POSTGRES_DB": "mydb",
            "POSTGRES_USER": "myuser",
            "POSTGRES_PASSWORD": "mypass",
            "POSTGRES_HOST": "myhost",
            "POSTGRES_PORT": "5433",
        },
        clear=True,
    )
    def test_split_postgres_vars_fallback(self):
        import config.settings.base as base_settings

        importlib.reload(base_settings)

        assert base_settings.DATABASE_URL == ""
        db = base_settings.DATABASES["default"]
        assert db["NAME"] == "mydb"
        assert db["USER"] == "myuser"
        assert db["PASSWORD"] == "mypass"
        assert db["HOST"] == "myhost"
        assert db["PORT"] == "5433"


class TestProductionSettings:
    """Ensure production fails fast when configuration is missing."""

    @mock.patch.dict(os.environ, {}, clear=True)
    def test_missing_database_config_raises(self):
        with pytest.raises(ValueError, match="Production database configuration is missing"):
            import config.settings.production as prod_settings  # noqa: F401

            importlib.reload(prod_settings)

    @mock.patch.dict(
        os.environ,
        {
            "DATABASE_URL": "postgres://user:pass@host:5432/db",
        },
        clear=True,
    )
    def test_database_url_satisfies_production_check(self):
        import config.settings.production as prod_settings

        # Should not raise
        importlib.reload(prod_settings)

        assert prod_settings.DEBUG is False

    @mock.patch.dict(
        os.environ,
        {
            "POSTGRES_HOST": "host",
            "POSTGRES_DB": "db",
            "POSTGRES_USER": "user",
            "POSTGRES_PASSWORD": "pass",
        },
        clear=True,
    )
    def test_split_vars_satisfy_production_check(self):
        import config.settings.production as prod_settings

        # Should not raise
        importlib.reload(prod_settings)

        assert prod_settings.DEBUG is False


class TestCeleryApp:
    """Ensure Celery does not silently default to local settings on Railway."""

    @mock.patch.dict(os.environ, {"RAILWAY_PROCESS_TYPE": "web"}, clear=True)
    def test_railway_without_django_settings_module_raises(self):
        with pytest.raises(RuntimeError, match="DJANGO_SETTINGS_MODULE must be explicitly set"):
            import celery_app

            importlib.reload(celery_app)

    @mock.patch.dict(
        os.environ,
        {
            "RAILWAY_PROCESS_TYPE": "web",
            "DJANGO_SETTINGS_MODULE": "config.settings.production",
        },
        clear=True,
    )
    def test_railway_with_django_settings_module_ok(self):
        import celery_app

        # Should not raise
        importlib.reload(celery_app)

        assert os.environ["DJANGO_SETTINGS_MODULE"] == "config.settings.production"

    @mock.patch.dict(os.environ, {}, clear=True)
    def test_local_defaults_to_local_settings(self):
        import celery_app

        importlib.reload(celery_app)

        assert os.environ["DJANGO_SETTINGS_MODULE"] == "config.settings.local"
