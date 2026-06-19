from django.test import TestCase
from django.http import Http404
from rest_framework.exceptions import ValidationError

from ai_engine import services
from tests.factories import (
    create_interview_session,
    create_interview_statuses,
    create_user,
)


class AIEngineServicesTests(TestCase):
    """Tests for ai_engine services."""

    def setUp(self):
        self.user = create_user()
        self.other_user = create_user(email="other@example.com")
        self.statuses = create_interview_statuses()
        
        self.session = create_interview_session(
            user=self.user,
            status=self.statuses["INTERVIEW_EVALUATED"],
            answer="Test answer"
        )
        
        self.non_terminal_session = create_interview_session(
            user=self.user,
            status=self.statuses["INTERVIEW_SUBMITTED"],
            answer="Test answer"
        )
        
        self.no_answer_session = create_interview_session(
            user=self.user,
            status=self.statuses["INTERVIEW_EVALUATED"],
            answer=""
        )

    def test_trigger_evaluation_creates_record(self):
        evaluation = services.trigger_evaluation(self.session.pk, self.user)
        self.assertIsNotNone(evaluation.pk)
        self.assertEqual(evaluation.interview, self.session)

    def test_trigger_evaluation_score_range(self):
        evaluation = services.trigger_evaluation(self.session.pk, self.user)
        self.assertTrue(40 <= evaluation.score <= 95)

    def test_trigger_evaluation_mock_raw_response(self):
        evaluation = services.trigger_evaluation(self.session.pk, self.user)
        self.assertTrue(evaluation.raw_response.get("mock"))

    def test_trigger_evaluation_no_answer_raises(self):
        with self.assertRaises(ValidationError):
            services.trigger_evaluation(self.no_answer_session.pk, self.user)

    def test_trigger_evaluation_non_terminal_raises(self):
        with self.assertRaises(ValidationError):
            services.trigger_evaluation(self.non_terminal_session.pk, self.user)

    def test_trigger_evaluation_wrong_user_raises(self):
        with self.assertRaises(Http404):
            services.trigger_evaluation(self.session.pk, self.other_user)

    def test_get_session_evaluations_returns_queryset(self):
        services.trigger_evaluation(self.session.pk, self.user)
        qs = services.get_session_evaluations(self.session.pk, self.user)
        self.assertEqual(qs.count(), 1)

    def test_get_session_evaluations_wrong_user_raises(self):
        with self.assertRaises(Http404):
            services.get_session_evaluations(self.session.pk, self.other_user)
