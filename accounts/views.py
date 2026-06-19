"""
Views for the accounts app.

Views are thin HTTP controllers — they wire together permissions,
serializers, and the service layer without containing any business
logic themselves.
"""

from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from . import services
from .serializers import (
    ChangePasswordSerializer,
    RegisterSerializer,
    UserProfileSerializer,
)


class RegisterView(generics.CreateAPIView):
    """Create a new user account.

    **POST /api/accounts/register/**

    Accepts ``email``, ``name``, ``password``, and ``password_confirm``.
    Returns the created user's email and name on success (HTTP 201).
    """

    serializer_class = RegisterSerializer
    permission_classes = (AllowAny,)


class ProfileView(generics.RetrieveUpdateAPIView):
    """Retrieve or update the authenticated user's profile.

    **GET  /api/accounts/profile/** — return the current user's profile.
    **PATCH /api/accounts/profile/** — partially update the profile.

    PUT is intentionally disabled; use PATCH for partial updates.
    """

    serializer_class = UserProfileSerializer
    permission_classes = (IsAuthenticated,)
    http_method_names = ("get", "patch", "head", "options")

    def get_object(self):
        """Return the currently authenticated user."""
        return self.request.user


class ChangePasswordView(generics.GenericAPIView):
    """Change the authenticated user's password.

    **POST /api/accounts/change-password/**

    Accepts ``old_password``, ``new_password``, and
    ``new_password_confirm``.  Returns HTTP 200 with a success message
    when the password has been updated.
    """

    serializer_class = ChangePasswordSerializer
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        """Validate the payload and delegate to the service layer."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        services.change_password(
            user=request.user,
            old_password=serializer.validated_data["old_password"],
            new_password=serializer.validated_data["new_password"],
        )

        return Response(
            {"detail": "Password updated successfully."},
            status=status.HTTP_200_OK,
        )
