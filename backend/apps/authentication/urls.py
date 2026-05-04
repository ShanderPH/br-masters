from __future__ import annotations

from django.urls import path

from apps.authentication.views import LoginView, MeView

urlpatterns = [
    path("login", LoginView.as_view(), name="auth-login"),
    path("me", MeView.as_view(), name="auth-me"),
]
