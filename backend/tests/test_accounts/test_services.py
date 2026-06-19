from django.test import TestCase
from rest_framework.exceptions import ValidationError
from django.contrib.auth import get_user_model

from accounts import services
from tests.factories import create_user

User = get_user_model()


class AccountsServicesTests(TestCase):
    """Tests for accounts services."""

    def setUp(self):
        self.user = create_user(password="password123")

    def test_create_user_success(self):
        user = services.create_user("new@example.com", "New User", "password123")
        self.assertIsNotNone(user.pk)
        self.assertTrue(user.check_password("password123"))

    def test_update_profile_partial(self):
        updated = services.update_profile(self.user, {"name": "Changed Name"})
        self.assertEqual(updated.name, "Changed Name")
        self.user.refresh_from_db()
        self.assertEqual(self.user.name, "Changed Name")

    def test_change_password_success(self):
        services.change_password(self.user, "password123", "newpassword123")
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("newpassword123"))
        self.assertFalse(self.user.check_password("password123"))

    def test_change_password_wrong_old_raises(self):
        with self.assertRaises(ValidationError):
            services.change_password(self.user, "wrongpassword", "newpassword123")
