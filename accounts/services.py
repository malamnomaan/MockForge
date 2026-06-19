"""
Business-logic layer for the accounts app.

Every function in this module is a pure service function: it receives
domain objects (User instances, validated data dicts, etc.) and returns
domain objects.  No HTTP concepts (request, response, status codes)
leak into this layer.
"""

from django.contrib.auth import get_user_model
from rest_framework.exceptions import ValidationError

User = get_user_model()


def create_user(email: str, name: str, password: str) -> User:
    """Create and return a new user.

    Email normalisation and password hashing are delegated to
    ``UserManager.create_user``.

    Args:
        email: The user's email address.
        name: The user's full name.
        password: The plain-text password (will be hashed by the manager).

    Returns:
        The newly created ``User`` instance.
    """
    return User.objects.create_user(
        email=email,
        password=password,
        name=name,
    )


def update_profile(user: User, validated_data: dict) -> User:
    """Update mutable profile fields on an existing user.

    Only fields present in *validated_data* are touched; absent keys
    are silently ignored so callers can pass partial data from a
    ``PATCH`` request.

    Args:
        user: The ``User`` instance to update.
        validated_data: A dict of field names to new values.

    Returns:
        The updated ``User`` instance (already saved).
    """
    for attr, value in validated_data.items():
        setattr(user, attr, value)
    user.save(update_fields=validated_data.keys())
    return user


def change_password(user: User, old_password: str, new_password: str) -> None:
    """Change a user's password after verifying the current one.

    Args:
        user: The ``User`` instance whose password will be changed.
        old_password: The current plain-text password for verification.
        new_password: The new plain-text password (will be hashed).

    Raises:
        ValidationError: If *old_password* does not match the stored hash.
    """
    if not user.check_password(old_password):
        raise ValidationError(
            {"old_password": "Current password is incorrect."}
        )

    user.set_password(new_password)
    user.save(update_fields=["password"])
