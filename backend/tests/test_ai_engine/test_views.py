from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from tests.factories import (
    create_interview_session,
    create_interview_statuses,
    create_user,
)
from interviews.models import AIEvaluation


class TriggerEvaluationViewTests(APITestCase):
    """Tests for the TriggerEvaluationView endpoint."""

    def setUp(self):
        self.user = create_user()
        self.other_user = create_user(email="other@example.com")
        self.statuses = create_interview_statuses()
        
        self.session = create_interview_session(
            user=self.user,
            status=self.statuses["INTERVIEW_EVALUATED"],
            answer="This is a test answer."
        )
        
        self.non_terminal_session = create_interview_session(
            user=self.user,
            status=self.statuses["INTERVIEW_SUBMITTED"],
            answer="Answer in progress"
        )
        
        self.no_answer_session = create_interview_session(
            user=self.user,
            status=self.statuses["INTERVIEW_EVALUATED"],
            answer=""
        )

        self.url = reverse("ai_engine:trigger-evaluation", kwargs={"session_id": self.session.pk})

    def test_trigger_evaluation_success(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.url)
        print("URL:", self.url)
        print("RESPONSE STATUS:", response.status_code)
        print("RESPONSE DATA:", getattr(response, "data", "No data"))
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("score", response.data)
        self.assertIn("strengths", response.data)
        self.assertEqual(AIEvaluation.objects.count(), 1)

    def test_trigger_evaluation_no_answer(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("ai_engine:trigger-evaluation", kwargs={"session_id": self.no_answer_session.pk})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("answer", response.data)

    def test_trigger_evaluation_non_terminal_status(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("ai_engine:trigger-evaluation", kwargs={"session_id": self.non_terminal_session.pk})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("status", response.data)

    def test_trigger_evaluation_session_not_found(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("ai_engine:trigger-evaluation", kwargs={"session_id": 9999})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_trigger_evaluation_other_user_session(self):
        self.client.force_authenticate(user=self.other_user)
        response = self.client.post(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_trigger_evaluation_unauthenticated(self):
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class SessionEvaluationsViewTests(APITestCase):
    """Tests for the SessionEvaluationsView endpoint."""

    def setUp(self):
        self.user = create_user()
        self.other_user = create_user(email="other@example.com")
        self.statuses = create_interview_statuses()
        self.session = create_interview_session(
            user=self.user,
            status=self.statuses["INTERVIEW_EVALUATED"],
            answer="This is a test answer."
        )
        self.url = reverse("ai_engine:session-evaluations", kwargs={"session_id": self.session.pk})

    def test_list_evaluations_success(self):
        # Create some evaluations
        AIEvaluation.objects.create(interview=self.session, final_score=80, raw_response={})
        AIEvaluation.objects.create(interview=self.session, final_score=90, raw_response={})
        
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Handle pagination if any, or list directly
        data = response.data.get('results', response.data)
        self.assertEqual(len(data), 2)
        # ordered by -created_at
        self.assertEqual(data[0]["score"], 90)

    def test_list_evaluations_empty(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data.get('results', response.data)
        self.assertEqual(len(data), 0)

    def test_list_evaluations_other_user_session(self):
        self.client.force_authenticate(user=self.other_user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_list_evaluations_unauthenticated(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
