from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model using email as the primary authentication identifier.
    Extends AbstractBaseUser for full control over authentication behaviour,
    and PermissionsMixin for Django's built-in permission framework.
    """

    email = models.EmailField(
        "email address",
        unique=True,
        db_index=True,
        error_messages={
            "unique": "A user with that email already exists.",
        },
    )
    name = models.CharField("full name", max_length=255)
    is_active = models.BooleanField(
        "active",
        default=True,
        help_text="Designates whether this user should be treated as active.",
    )
    is_staff = models.BooleanField(
        "staff status",
        default=False,
        help_text="Designates whether the user can log into the admin site.",
    )
    created_at = models.DateTimeField("created at", auto_now_add=True)
    updated_at = models.DateTimeField("updated at", auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    class Meta:
        db_table = "accounts_user"
        ordering = ["-created_at"]
        verbose_name = "user"
        verbose_name_plural = "users"

    def __str__(self):
        return self.email

    def get_short_name(self):
        """Return the short name for the user."""
        return self.name.split()[0] if self.name else self.email
