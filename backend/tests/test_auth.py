from __future__ import annotations

import json
import time
from unittest.mock import patch

import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APIClient


def _generate_rsa_keypair():
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_key = private_key.public_key()
    return private_key, public_key


def _public_key_to_jwk(public_key, kid: str) -> dict:
    numbers = public_key.public_numbers()
    import base64

    def _b64url(v: int) -> str:
        length = (v.bit_length() + 7) // 8
        return base64.urlsafe_b64encode(v.to_bytes(length, "big")).rstrip(b"=").decode()

    return {
        "kty": "RSA",
        "kid": kid,
        "use": "sig",
        "alg": "RS256",
        "n": _b64url(numbers.n),
        "e": _b64url(numbers.e),
    }


_private_key, _public_key = _generate_rsa_keypair()
_KID = "test-kid-001"
_JWK = _public_key_to_jwk(_public_key, _KID)
_TEST_SUPABASE_URL = "https://test.supabase.co"
_TEST_ISSUER = f"{_TEST_SUPABASE_URL}/auth/v1"

_APP_USER_DATA = {
    "id": "11111111-1111-1111-1111-111111111111",
    "username": "testuser",
    "firebase_id": "001",
    "role": "user",
    "favorite_team_id": "22222222-2222-2222-2222-222222222222",
}

_PROFILE_DATA = {
    "id": "11111111-1111-1111-1111-111111111111",
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "avatar_url": "https://example.com/avatar.png",
}

_SESSION_DATA = {
    "access_token": "fake-access-token",
    "refresh_token": "fake-refresh-token",
    "expires_in": 3600,
    "expires_at": int(time.time()) + 3600,
    "token_type": "bearer",
    "user": {"id": "11111111-1111-1111-1111-111111111111"},
}


def _build_valid_jwt(user_id: str = _APP_USER_DATA["id"]) -> str:
    now = int(time.time())
    return jwt.encode(
        {
            "sub": user_id,
            "iss": _TEST_ISSUER,
            "aud": "authenticated",
            "exp": now + 3600,
            "iat": now,
            "email": "test@example.com",
        },
        _private_key,
        algorithm="RS256",
        headers={"kid": _KID},
    )


def _build_expired_jwt() -> str:
    now = int(time.time())
    return jwt.encode(
        {
            "sub": _APP_USER_DATA["id"],
            "iss": _TEST_ISSUER,
            "aud": "authenticated",
            "exp": now - 60,
            "iat": now - 3600,
        },
        _private_key,
        algorithm="RS256",
        headers={"kid": _KID},
    )


def _mock_jwks_response():
    return {"keys": [_JWK]}


class TestLoginView:
    def test_email_login_success(self):
        client = APIClient()
        payload = {"email": "test@example.com", "password": "password123"}

        with (
            patch(
                "apps.authentication.views.get_supabase_service"
            ) as mock_get_service,
        ):
            mock_service = mock_get_service.return_value
            mock_service.sign_in_with_password.return_value = _SESSION_DATA

            response = client.post(
                "/api/v1/auth/login",
                data=json.dumps(payload),
                content_type="application/json",
            )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert "user" in data
        assert "session" in data
        assert data["session"]["access_token"] == "fake-access-token"
        assert data["session"]["refresh_token"] == "fake-refresh-token"

        mock_service.sign_in_with_password.assert_called_once_with(
            "test@example.com", "password123"
        )

    def test_email_login_invalid_credentials(self):
        client = APIClient()
        payload = {"email": "test@example.com", "password": "wrong"}

        with (
            patch(
                "apps.authentication.views.get_supabase_service"
            ) as mock_get_service,
        ):
            from apps.authentication.services import SupabaseAuthError

            mock_service = mock_get_service.return_value
            mock_service.sign_in_with_password.side_effect = SupabaseAuthError(
                "Invalid credentials"
            )

            response = client.post(
                "/api/v1/auth/login",
                data=json.dumps(payload),
                content_type="application/json",
            )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert data["success"] is False
        assert "error" in data

    def test_email_login_missing_password(self):
        client = APIClient()
        payload = {"email": "test@example.com"}

        response = client.post(
            "/api/v1/auth/login",
            data=json.dumps(payload),
            content_type="application/json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_email_login_missing_credentials(self):
        client = APIClient()
        payload = {"password": "password123"}

        response = client.post(
            "/api/v1/auth/login",
            data=json.dumps(payload),
            content_type="application/json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_identifier_login_success(self):
        client = APIClient()
        payload = {"identifier": "001", "password": "password123"}

        with (
            patch(
                "apps.authentication.views.get_supabase_service"
            ) as mock_get_service,
        ):
            mock_service = mock_get_service.return_value

            mock_service.resolve_email_for_identifier.return_value = (
                "test@example.com"
            )
            mock_service.sign_in_with_password.return_value = _SESSION_DATA
            mock_service.get_user_by_id.return_value = _APP_USER_DATA
            mock_service.get_user_profile.return_value = _PROFILE_DATA

            response = client.post(
                "/api/v1/auth/login",
                data=json.dumps(payload),
                content_type="application/json",
            )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert data["user"]["username"] == "testuser"
        assert data["user"]["firebase_id"] == "001"

    def test_identifier_login_user_not_found(self):
        client = APIClient()
        payload = {"identifier": "999", "password": "password123"}

        with (
            patch(
                "apps.authentication.views.get_supabase_service"
            ) as mock_get_service,
        ):
            mock_service = mock_get_service.return_value
            mock_service.resolve_email_for_identifier.return_value = None

            response = client.post(
                "/api/v1/auth/login",
                data=json.dumps(payload),
                content_type="application/json",
            )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert data["success"] is False

    def test_login_email_and_identifier_both_provided(self):
        client = APIClient()
        payload = {
            "email": "test@example.com",
            "identifier": "001",
            "password": "password123",
        }

        response = client.post(
            "/api/v1/auth/login",
            data=json.dumps(payload),
            content_type="application/json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_with_app_user_not_found(self):
        client = APIClient()
        payload = {"email": "test@example.com", "password": "password123"}

        with (
            patch(
                "apps.authentication.views.get_supabase_service"
            ) as mock_get_service,
        ):
            mock_service = mock_get_service.return_value
            mock_service.sign_in_with_password.return_value = _SESSION_DATA
            mock_service.get_user_by_id.return_value = None

            response = client.post(
                "/api/v1/auth/login",
                data=json.dumps(payload),
                content_type="application/json",
            )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestMeView:
    @override_settings(
        SUPABASE_URL=_TEST_SUPABASE_URL,
        SUPABASE_JWT_ISSUER="",
        SUPABASE_JWT_AUDIENCE="authenticated",
    )
    def test_me_with_valid_token(self):
        token = _build_valid_jwt()
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        with (
            patch(
                "apps.authentication.authentication._get_jwks"
            ) as mock_jwks,
            patch(
                "apps.authentication.views.AppUserService"
            ) as mock_app_user_svc,
        ):
            mock_jwks.return_value = _mock_jwks_response()

            mock_instance = mock_app_user_svc.return_value
            mock_instance.build_app_user.return_value = {
                "id": _APP_USER_DATA["id"],
                "username": _APP_USER_DATA["username"],
                "firebase_id": _APP_USER_DATA["firebase_id"],
                "role": _APP_USER_DATA["role"],
                "favorite_team_id": _APP_USER_DATA["favorite_team_id"],
                "profile": {
                    "first_name": _PROFILE_DATA["first_name"],
                    "last_name": _PROFILE_DATA["last_name"],
                    "email": _PROFILE_DATA["email"],
                    "avatar_url": _PROFILE_DATA["avatar_url"],
                },
            }

            response = client.get("/api/v1/auth/me")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == _APP_USER_DATA["id"]
        assert data["username"] == "testuser"

    @override_settings(
        SUPABASE_URL=_TEST_SUPABASE_URL,
        SUPABASE_JWT_ISSUER="",
        SUPABASE_JWT_AUDIENCE="authenticated",
    )
    def test_me_with_expired_token(self):
        token = _build_expired_jwt()
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        with (
            patch(
                "apps.authentication.authentication._get_jwks"
            ) as mock_jwks,
        ):
            mock_jwks.return_value = _mock_jwks_response()

            response = client.get("/api/v1/auth/me")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_me_without_token(self):
        client = APIClient()
        response = client.get("/api/v1/auth/me")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_me_with_malformed_token(self):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION="Bearer not.a.real.token")

        response = client.get("/api/v1/auth/me")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_me_with_wrong_issuer(self):
        token = jwt.encode(
            {
                "sub": _APP_USER_DATA["id"],
                "iss": "https://wrong-issuer/auth/v1",
                "aud": "authenticated",
                "exp": int(time.time()) + 3600,
                "iat": int(time.time()),
            },
            _private_key,
            algorithm="RS256",
            headers={"kid": _KID},
        )

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        with (
            override_settings(
                SUPABASE_URL=_TEST_SUPABASE_URL,
                SUPABASE_JWT_ISSUER="",
                SUPABASE_JWT_AUDIENCE="authenticated",
            ),
            patch(
                "apps.authentication.authentication._get_jwks"
            ) as mock_jwks,
        ):
            mock_jwks.return_value = _mock_jwks_response()
            response = client.get("/api/v1/auth/me")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
