from __future__ import annotations

import logging
import time
from typing import Any

import httpx
import jwt
from django.conf import settings
from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed

logger = logging.getLogger(__name__)

_JWKS_CACHE: dict[str, Any] | None = None
_JWKS_CACHE_TTL = 3600
_JWKS_CACHE_FETCHED_AT = 0.0


def _get_jwks() -> dict[str, Any]:
    global _JWKS_CACHE, _JWKS_CACHE_FETCHED_AT

    now = time.monotonic()
    if _JWKS_CACHE is not None and (now - _JWKS_CACHE_FETCHED_AT) < _JWKS_CACHE_TTL:
        return _JWKS_CACHE

    jwks_url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
    try:
        response = httpx.get(jwks_url, timeout=10.0)
        response.raise_for_status()
        _JWKS_CACHE = response.json()
        _JWKS_CACHE_FETCHED_AT = now
        return _JWKS_CACHE
    except Exception as exc:
        logger.error("Failed to fetch JWKS from %s: %s", jwks_url, exc)
        raise AuthenticationFailed("Unable to verify authentication token") from exc


def _get_jwt_issuer() -> str:
    if settings.SUPABASE_JWT_ISSUER:
        return settings.SUPABASE_JWT_ISSUER
    return f"{settings.SUPABASE_URL}/auth/v1"


class SupabaseJWTAuthentication(authentication.BaseAuthentication):
    keyword = "Bearer"

    def authenticate_header(self, request: Any) -> str:
        return self.keyword

    def authenticate(self, request: Any) -> tuple[Any, Any] | None:
        auth_header = authentication.get_authorization_header(request).decode("utf-8")

        if not auth_header or not auth_header.startswith(f"{self.keyword} "):
            return None

        token = auth_header[len(self.keyword) + 1 :].strip()
        if not token:
            return None

        try:
            unverified_header = jwt.get_unverified_header(token)
        except jwt.PyJWTError as exc:
            raise AuthenticationFailed("Invalid token format") from exc

        kid = unverified_header.get("kid")
        if not kid:
            raise AuthenticationFailed("Token missing key identifier")

        jwks = _get_jwks()
        signing_key = None
        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                signing_key = jwt.PyJWK(key).key
                break

        if signing_key is None:
            raise AuthenticationFailed("Token signing key not found")

        issuer = _get_jwt_issuer()

        try:
            payload = jwt.decode(
                token,
                key=signing_key,
                algorithms=["RS256"],
                issuer=issuer,
                audience=settings.SUPABASE_JWT_AUDIENCE,
            )
        except jwt.ExpiredSignatureError as exc:
            raise AuthenticationFailed("Token has expired") from exc
        except jwt.InvalidIssuerError as exc:
            logger.warning(
                "JWT issuer mismatch: expected=%s got=%s",
                issuer,
                getattr(exc, "args", ""),
            )
            raise AuthenticationFailed("Invalid token issuer") from exc
        except jwt.InvalidAudienceError as exc:
            raise AuthenticationFailed("Invalid token audience") from exc
        except jwt.PyJWTError as exc:
            raise AuthenticationFailed("Invalid token") from exc

        user_id = payload.get("sub")
        if not user_id:
            raise AuthenticationFailed("Token missing subject claim")

        return (AuthUser(user_id, payload), token)


class AuthUser:
    def __init__(self, user_id: str, payload: dict[str, Any]) -> None:
        self.id = user_id
        self.payload = payload
        self.is_authenticated = True

    def __str__(self) -> str:
        return self.id
