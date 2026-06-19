"""
URL configuration for the accounts app.

JWT authentication endpoints (login and token refresh) are provided by
``rest_framework_simplejwt`` out of the box.  Since the User model uses
``email`` as ``USERNAME_FIELD``, ``TokenObtainPairView`` expects
``email`` + ``password`` by default.
"""

from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import ChangePasswordView, ProfileView, RegisterView, ProfileAchievementsView

app_name = "accounts"

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", TokenObtainPairView.as_view(), name="login"),
    path("login/refresh/", TokenRefreshView.as_view(), name="login-refresh"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("profile/achievements/", ProfileAchievementsView.as_view(), name="profile-achievements"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
]
