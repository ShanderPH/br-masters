from __future__ import annotations

import logging

from rest_framework import permissions, status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.authentication import SupabaseJWTAuthentication
from apps.authentication.serializers import (
    AppUserSerializer,
    LoginRequestSerializer,
    LoginResponseSerializer,
)
from apps.authentication.services import (
    AppUserNotFoundError,
    AppUserService,
    SupabaseAuthError,
    get_supabase_service,
)

logger = logging.getLogger(__name__)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request: Request) -> Response:
        serializer = LoginRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"success": False, "error": "Invalid request data"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = serializer.validated_data.get("email")
        identifier = serializer.validated_data.get("identifier")
        password = serializer.validated_data["password"]

        supabase = get_supabase_service()

        if identifier:
            resolved_email = supabase.resolve_email_for_identifier(identifier)
            if resolved_email is None:
                return Response(
                    {
                        "success": False,
                        "error": "Credenciais inválidas. Verifique seus dados e tente novamente.",
                    },
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            email = resolved_email

        try:
            session_data = supabase.sign_in_with_password(email, password)
        except SupabaseAuthError:
            return Response(
                {
                    "success": False,
                    "error": "Credenciais inválidas. Verifique seus dados e tente novamente.",
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        auth_user_id = session_data["user"]["id"]
        app_user_service = AppUserService(supabase)

        try:
            app_user = app_user_service.build_app_user(auth_user_id)
        except AppUserNotFoundError:
            return Response(
                {"success": False, "error": "User profile not found"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        response_data = {
            "success": True,
            "user": app_user,
            "session": session_data,
        }

        output = LoginResponseSerializer(response_data)
        return Response(output.data, status=status.HTTP_200_OK)


class MeView(APIView):
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request: Request) -> Response:
        user = request.user
        app_user_service = AppUserService()

        try:
            app_user = app_user_service.build_app_user(user.id)
        except AppUserNotFoundError:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AppUserSerializer(data=app_user)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
