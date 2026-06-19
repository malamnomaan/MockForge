from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from tests.factories import (
    create_interview_session,
    create_interview_statuses,
    create_user,
)
from interviews.models import InterviewSession


class InterviewsViewsTests(APITestCase):
    """Tests for interviews views."""

    def setUp(self):
        self.user = create_user()
        self.other_user = create_user(email="other@example.com")
        self.statuses = create_interview_statuses()
        self.session = create_interview_session(self.user, self.statuses["INTERVIEW_CREATED"])
        
        self.status_list_url = reverse("interviews:status-list")
        self.session_list_url = reverse("interviews:session-list")
        self.session_detail_url = reverse("interviews:session-detail", kwargs={"pk": self.session.pk})
        self.session_transition_url = reverse("interviews:session-transition", kwargs={"pk": self.session.pk})

    def test_list_statuses_success(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.status_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should be at least 4 statuses
        data = response.data.get('results', response.data)
        self.assertTrue(len(data) >= 4)

    def test_status_detail_by_code(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("interviews:status-detail", kwargs={"code": "INTERVIEW_CREATED"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["code"], "INTERVIEW_CREATED")

    def test_create_session_success(self):
        self.client.force_authenticate(user=self.user)
        data = {"type": "DSA", "question": "Reverse a linked list"}
        response = self.client.post(self.session_list_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["question"], "Reverse a linked list")
        self.assertEqual(response.data["status"]["code"], "INTERVIEW_CREATED")

    def test_list_sessions_returns_own_only(self):
        # Create a session for other user
        create_interview_session(self.other_user, self.statuses["INTERVIEW_CREATED"])
        
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.session_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data.get('results', response.data)
        self.assertEqual(len(data), 1)  # Only the one from setUp

    def test_update_session_submit_answer(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(self.session_detail_url, {"answer": "My answer"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.session.refresh_from_db()
        self.assertEqual(self.session.answer, "My answer")

    def test_transition_success(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.session_transition_url, {"to_status_code": "INTERVIEW_IN_PROGRESS"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.session.refresh_from_db()
        self.assertEqual(self.session.status.code, "INTERVIEW_IN_PROGRESS")

    def test_transition_invalid(self):
        self.client.force_authenticate(user=self.user)
        # Cannot skip from CREATED to SUBMITTED
        response = self.client.post(self.session_transition_url, {"to_status_code": "INTERVIEW_SUBMITTED"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
