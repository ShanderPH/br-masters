#!/usr/bin/env bash
set -e

case "${RAILWAY_PROCESS_TYPE:-web}" in
    web)
        echo "Starting web server..."
        gunicorn config.wsgi:application \
            --bind "0.0.0.0:${PORT:-8000}" \
            --workers "${WEB_WORKERS:-2}" \
            --threads "${WEB_THREADS:-2}" \
            --access-logfile - \
            --error-logfile -
        ;;
    worker)
        echo "Starting Celery worker..."
        celery -A celery_app worker \
            --loglevel="${CELERY_LOG_LEVEL:-info}" \
            --concurrency="${CELERY_WORKER_CONCURRENCY:-2}" \
            --pool="${CELERY_WORKER_POOL:-solo}"
        ;;
    beat)
        echo "Starting Celery beat..."
        celery -A celery_app beat \
            --loglevel="${CELERY_LOG_LEVEL:-info}" \
            --scheduler=django_celery_beat.schedulers:DatabaseScheduler
        ;;
    *)
        echo "Unknown RAILWAY_PROCESS_TYPE: ${RAILWAY_PROCESS_TYPE}"
        echo "Valid values: web, worker, beat"
        exit 1
        ;;
esac
