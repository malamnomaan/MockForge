from django.test import TestCase
from rest_framework.exceptions import ValidationError

from interviews.bll import start_interview, transition_status
from interviews.services.status_service import get_initial_status
from tests.factories import (
    create_interview_session,
    create_interview_statuses,
    create_user,
)


class InterviewsServicesTests(TestCase):
    """Tests for interviews services."""

    def setUp(self):
        self.user = create_user()
        self.statuses = create_interview_statuses()
        self.session = create_interview_session(self.user, self.statuses["INTERVIEW_CREATED"])

    def test_get_initial_status(self):
        status = get_initial_status()
        self.assertEqual(status.code, "INTERVIEW_CREATED")

    def test_create_session(self):
        session = start_interview(self.user, "DSA", "Test question")
        self.assertEqual(session.status.code, "INTERVIEW_CREATED")
        self.assertEqual(session.user, self.user)

    def test_transition_status_success(self):
        transition_status(self.session, "INTERVIEW_IN_PROGRESS")
        self.session.refresh_from_db()
        self.assertEqual(self.session.status.code, "INTERVIEW_IN_PROGRESS")

    def test_transition_status_invalid_raises(self):
        with self.assertRaises(ValidationError):
            transition_status(self.session, "INTERVIEW_SUBMITTED")

    def test_transition_status_terminal_raises(self):
        self.session.status = self.statuses["INTERVIEW_EVALUATED"]
        self.session.save()
        with self.assertRaises(ValidationError):
            transition_status(self.session, "INTERVIEW_IN_PROGRESS")
