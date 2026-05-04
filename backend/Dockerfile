FROM python:3.14-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

FROM base AS builder

COPY pyproject.toml /app/pyproject.toml
RUN pip install --prefix=/install -e ".[dev]"

FROM base AS runtime

COPY --from=builder /install /usr/local

COPY . /app/

RUN adduser --disabled-password --no-create-home appuser && \
    chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2", "--threads", "2"]
