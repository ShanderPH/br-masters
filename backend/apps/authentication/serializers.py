from __future__ import annotations

from rest_framework import serializers


class LoginRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    identifier = serializers.CharField(required=False)
    password = serializers.CharField(required=True, min_length=1, max_length=128)

    def validate(self, data: dict) -> dict:
        has_email = bool(data.get("email"))
        has_identifier = bool(data.get("identifier"))

        if not has_email and not has_identifier:
            raise serializers.ValidationError(
                "Either email or identifier must be provided"
            )
        if has_email and has_identifier:
            raise serializers.ValidationError(
                "Provide either email or identifier, not both"
            )
        return data


class AppUserProfileSerializer(serializers.Serializer):
    first_name = serializers.CharField(allow_blank=True, default="")
    last_name = serializers.CharField(allow_blank=True, default="")
    email = serializers.EmailField(allow_blank=True, default="")
    avatar_url = serializers.CharField(allow_blank=True, default="")


class AppUserSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    username = serializers.CharField(allow_blank=True, allow_null=True)
    firebase_id = serializers.CharField(allow_blank=True, allow_null=True)
    role = serializers.CharField(allow_blank=True, allow_null=True)
    favorite_team_id = serializers.UUIDField(allow_null=True)
    profile = AppUserProfileSerializer()


class SessionSerializer(serializers.Serializer):
    access_token = serializers.CharField()
    refresh_token = serializers.CharField()
    expires_in = serializers.IntegerField()
    expires_at = serializers.IntegerField(allow_null=True)
    token_type = serializers.CharField()
    user = serializers.DictField(child=serializers.CharField(allow_blank=True))


class LoginResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    user = AppUserSerializer(required=False)
    session = SessionSerializer(required=False)
    error = serializers.CharField(required=False, allow_blank=True)
