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
    
    # Additional Profile Fields
    bio = models.TextField("bio", max_length=500, blank=True)
    target_role = models.CharField("target role", max_length=100, blank=True)
    experience_level = models.CharField("experience level", max_length=50, blank=True)
    github_url = models.URLField("github url", max_length=200, blank=True)
    linkedin_url = models.URLField("linkedin url", max_length=200, blank=True)

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

class Badge(models.Model):
    CATEGORY_CHOICES = (
        ('streak', 'Streak'),
        ('learning', 'Learning'),
        ('cracking', 'Cracking'),
    )

    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    icon = models.CharField(max_length=50)
    color = models.CharField(max_length=20)
    requirement = models.PositiveIntegerField()

    class Meta:
        ordering = ['category', 'requirement']

    def __str__(self):
        return self.name
