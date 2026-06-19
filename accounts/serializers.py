"""
Serializers for the accounts app.

Serializers are responsible for validation and representation only.
All persistence and business logic is delegated to ``services.py``.
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from . import services

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    """Validate and process new-user registration data.

    Fields:
        email: Must be a valid, unique email address.
        name: The user's full name.
        password: Minimum 8 characters.
        password_confirm: Must match ``password``.
    """

    email = serializers.EmailField()
    name = serializers.CharField(max_length=255)
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"},
    )
    password_confirm = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"},
    )

    def validate_email(self, value: str) -> str:
        """Ensure the email address is not already registered."""
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "A user with that email already exists."
            )
        return value.lower()

    def validate(self, attrs: dict) -> dict:
        """Ensure both password fields match."""
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "Passwords do not match."}
            )
        return attrs

    def create(self, validated_data: dict) -> User:
        """Delegate user creation to the service layer."""
        return services.create_user(
            email=validated_data["email"],
            name=validated_data["name"],
            password=validated_data["password"],
        )

    def to_representation(self, instance: User) -> dict:
        """Return a minimal representation after successful registration."""
        return {
            "email": instance.email,
            "name": instance.name,
        }


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for reading and updating the authenticated user's profile.

    Read-only fields: ``email``, ``created_at``, ``updated_at``.
    Writable fields: ``name``.
    """

    class Meta:
        model = User
        fields = ("email", "name", "bio", "target_role", "experience_level", "github_url", "linkedin_url", "created_at", "updated_at")
        read_only_fields = ("email", "created_at", "updated_at")

    def update(self, instance: User, validated_data: dict) -> User:
        """Delegate profile update to the service layer."""
        return services.update_profile(instance, validated_data)


class ChangePasswordSerializer(serializers.Serializer):
    """Validate a password-change request.

    The authenticated user's current password is verified via the
    ``request.user`` instance available in serializer context.

    Fields:
        old_password: The user's current password.
        new_password: Minimum 8 characters.
        new_password_confirm: Must match ``new_password``.
    """

    old_password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )
    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"},
    )
    new_password_confirm = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"},
    )

    def validate_old_password(self, value: str) -> str:
        """Verify the old password against the authenticated user."""
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate(self, attrs: dict) -> dict:
        """Ensure both new-password fields match."""
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "New passwords do not match."}
            )
        return attrs
