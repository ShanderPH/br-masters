from __future__ import annotations

import logging
from typing import Any

from django.conf import settings
from supabase import Client, create_client

logger = logging.getLogger(__name__)


class SupabaseAuthError(Exception):
    pass


class AppUserNotFoundError(Exception):
    pass


class SupabaseService:
    def __init__(self) -> None:
        self._client: Client | None = None

    @property
    def client(self) -> Client:
        if self._client is None:
            self._client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_ANON_KEY,
            )
        return self._client

    def sign_in_with_password(self, email: str, password: str) -> dict[str, Any]:
        try:
            response = self.client.auth.sign_in_with_password(
                {"email": email, "password": password}
            )
        except Exception as exc:
            logger.warning("Supabase sign-in failed for email=%s: %s", email, exc)
            raise SupabaseAuthError("Invalid credentials") from exc

        session = response.session
        if session is None:
            raise SupabaseAuthError("No session returned from Supabase")

        return {
            "access_token": session.access_token,
            "refresh_token": session.refresh_token,
            "expires_in": session.expires_in,
            "expires_at": session.expires_at,
            "token_type": session.token_type,
            "user": {"id": session.user.id if session.user else None},
        }

    def get_user_by_id(self, user_id: str) -> dict[str, Any] | None:
        try:
            result = (
                self.client.from_("users")
                .select("*")
                .eq("id", user_id)
                .single()
                .execute()
            )
        except Exception:
            return None
        return result.data

    def get_user_profile(self, user_id: str) -> dict[str, Any] | None:
        try:
            result = (
                self.client.from_("user_profiles")
                .select("*")
                .eq("id", user_id)
                .single()
                .execute()
            )
        except Exception:
            return None
        return result.data

    def get_user_by_firebase_id(self, firebase_id: str) -> dict[str, Any] | None:
        try:
            result = (
                self.client.from_("users")
                .select("*")
                .eq("firebase_id", firebase_id)
                .single()
                .execute()
            )
        except Exception:
            return None
        return result.data

    def get_user_by_username(self, username: str) -> dict[str, Any] | None:
        try:
            result = (
                self.client.from_("users")
                .select("*")
                .eq("username", username)
                .single()
                .execute()
            )
        except Exception:
            return None
        return result.data

    def resolve_email_for_identifier(self, identifier: str) -> str | None:
        padded = identifier.strip().zfill(3)

        user_row = (
            self.get_user_by_firebase_id(padded)
            or self.get_user_by_username(padded)
            or self.get_user_by_firebase_id(identifier.strip())
            or self.get_user_by_username(identifier.strip())
        )

        if user_row is None:
            return None

        user_id = user_row.get("id")
        if not user_id:
            return None

        profile = self.get_user_profile(user_id)
        if profile and profile.get("email"):
            return profile["email"]

        return f"user{padded}@houseofguess.app"


_global_supabase_service = None


def get_supabase_service() -> SupabaseService:
    global _global_supabase_service
    if _global_supabase_service is None:
        _global_supabase_service = SupabaseService()
    return _global_supabase_service


class AppUserService:
    def __init__(self, supabase_service: SupabaseService | None = None) -> None:
        self.supabase = supabase_service or get_supabase_service()

    def build_app_user(self, auth_user_id: str) -> dict[str, Any]:
        user_row = self.supabase.get_user_by_id(auth_user_id)
        if user_row is None:
            raise AppUserNotFoundError(f"User not found: {auth_user_id}")

        profile_row = self.supabase.get_user_profile(auth_user_id)

        return {
            "id": user_row.get("id"),
            "username": user_row.get("username"),
            "firebase_id": user_row.get("firebase_id"),
            "role": user_row.get("role"),
            "favorite_team_id": user_row.get("favorite_team_id"),
            "profile": {
                "first_name": profile_row.get("first_name", "") if profile_row else "",
                "last_name": profile_row.get("last_name", "") if profile_row else "",
                "email": profile_row.get("email", "") if profile_row else "",
                "avatar_url": profile_row.get("avatar_url", "") if profile_row else "",
            },
        }
