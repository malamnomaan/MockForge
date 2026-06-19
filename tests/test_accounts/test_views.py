from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from tests.factories import create_user
from django.contrib.auth import get_user_model

User = get_user_model()


class AccountsViewsTests(APITestCase):
    """Tests for accounts views: register, login, profile, change_password."""

    def setUp(self):
        self.user = create_user(email="test@example.com", name="Test User", password="password123")
        self.register_url = reverse("accounts:register")
        self.login_url = reverse("accounts:login")
        self.refresh_url = reverse("accounts:login-refresh")
        self.profile_url = reverse("accounts:profile")
        self.change_password_url = reverse("accounts:change-password")

    def test_register_success(self):
        data = {
            "email": "new@example.com",
            "name": "New User",
            "password": "password123",
            "password_confirm": "password123",
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["email"], "new@example.com")
        self.assertTrue(User.objects.filter(email="new@example.com").exists())

    def test_register_duplicate_email(self):
        data = {
            "email": "test@example.com",
            "name": "Another User",
            "password": "password123",
            "password_confirm": "password123",
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_success(self):
        data = {"email": "test@example.com", "password": "password123"}
        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_wrong_password(self):
        data = {"email": "test@example.com", "password": "wrongpassword"}
        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_profile_success(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], self.user.email)

    def test_update_profile_name(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(self.profile_url, {"name": "Updated Name"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.name, "Updated Name")

    def test_update_profile_email_readonly(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(self.profile_url, {"email": "changed@example.com"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, "test@example.com")

    def test_change_password_success(self):
        self.client.force_authenticate(user=self.user)
        data = {
            "old_password": "password123",
            "new_password": "newpassword123",
            "new_password_confirm": "newpassword123",
        }
        response = self.client.post(self.change_password_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verify new password works
        login_resp = self.client.post(self.login_url, {"email": "test@example.com", "password": "newpassword123"})
        self.assertEqual(login_resp.status_code, status.HTTP_200_OK)

    def test_change_password_wrong_old(self):
        self.client.force_authenticate(user=self.user)
        data = {
            "old_password": "wrongpassword",
            "new_password": "newpassword123",
            "new_password_confirm": "newpassword123",
        }
        response = self.client.post(self.change_password_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
