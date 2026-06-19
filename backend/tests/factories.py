"""
Shared test factories for creating test data across all apps.

Centralises object creation so tests stay DRY and any schema change is
reflected in one place only.
"""

from django.contrib.auth import get_user_model

from interviews.models import AIEvaluation, InterviewSession, Status, StatusTransition

User = get_user_model()


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

def create_user(
    email="testuser@example.com",
    name="Test User",
    password="testpass123",
    **kwargs,
):
    """Create and return a regular user."""
    return User.objects.create_user(
        email=email,
        password=password,
        name=name,
        **kwargs,
    )


def create_superuser(
    email="admin@example.com",
    name="Admin User",
    password="adminpass123",
    **kwargs,
):
    """Create and return a superuser."""
    return User.objects.create_superuser(
        email=email,
        password=password,
        name=name,
        **kwargs,
    )


# ---------------------------------------------------------------------------
# Statuses
# ---------------------------------------------------------------------------

def create_status(
    code="TEST_STATUS",
    name="Test Status",
    category="INTERVIEW",
    order=0,
    is_terminal=False,
    is_active=True,
    **kwargs,
):
    """Create and return a Status record."""
    return Status.objects.create(
        code=code,
        name=name,
        category=category,
        order=order,
        is_terminal=is_terminal,
        is_active=is_active,
        **kwargs,
    )


def create_interview_statuses():
    """
    Create a standard set of interview workflow statuses and transitions.

    Returns a dict of status objects keyed by code:
        INTERVIEW_CREATED → INTERVIEW_IN_PROGRESS → INTERVIEW_SUBMITTED → INTERVIEW_EVALUATED

    All transitions between consecutive statuses are created and active.
    """
    created = create_status(
        code="INTERVIEW_CREATED",
        name="Created",
        category="INTERVIEW",
        order=0,
        is_terminal=False,
    )
    in_progress = create_status(
        code="INTERVIEW_IN_PROGRESS",
        name="In Progress",
        category="INTERVIEW",
        order=1,
        is_terminal=False,
    )
    submitted = create_status(
        code="INTERVIEW_SUBMITTED",
        name="Submitted",
        category="INTERVIEW",
        order=2,
        is_terminal=False,
    )
    evaluating = create_status(
        code="INTERVIEW_EVALUATING",
        name="Evaluating",
        category="INTERVIEW",
        order=3,
        is_terminal=False,
    )
    evaluated = create_status(
        code="INTERVIEW_EVALUATED",
        name="Evaluated",
        category="INTERVIEW",
        order=4,
        is_terminal=True,
    )

    # Create transitions
    StatusTransition.objects.create(
        from_status=created, to_status=in_progress, is_active=True,
    )
    StatusTransition.objects.create(
        from_status=in_progress, to_status=submitted, is_active=True,
    )
    StatusTransition.objects.create(
        from_status=submitted, to_status=evaluating, is_active=True,
    )
    StatusTransition.objects.create(
        from_status=evaluating, to_status=evaluated, is_active=True,
    )

    return {
        "INTERVIEW_CREATED": created,
        "INTERVIEW_IN_PROGRESS": in_progress,
        "INTERVIEW_SUBMITTED": submitted,
        "INTERVIEW_EVALUATING": evaluating,
        "INTERVIEW_EVALUATED": evaluated,
    }


def create_status_transition(from_status, to_status, is_active=True):
    """Create and return a StatusTransition."""
    return StatusTransition.objects.create(
        from_status=from_status,
        to_status=to_status,
        is_active=is_active,
    )


# ---------------------------------------------------------------------------
# Interview Sessions
# ---------------------------------------------------------------------------

def create_interview_session(
    user,
    status,
    interview_type="DSA",
    question="Implement a binary search tree.",
    answer=None,
    **kwargs,
):
    """Create and return an InterviewSession."""
    return InterviewSession.objects.create(
        user=user,
        status=status,
        type=interview_type,
        question=question,
        answer=answer,
        **kwargs,
    )


# ---------------------------------------------------------------------------
# AI Evaluations
# ---------------------------------------------------------------------------

def create_ai_evaluation(
    interview,
    final_score=75,
    strengths=None,
    weaknesses=None,
    improvements=None,
    raw_response=None,
    **kwargs,
):
    """Create and return an AIEvaluation."""
    return AIEvaluation.objects.create(
        interview=interview,
        final_score=final_score,
        strengths=strengths or ["Good approach"],
        weaknesses=weaknesses or ["Needs improvement"],
        improvements=improvements or ["Practice more"],
        raw_response=raw_response or {"mock": True},
        **kwargs,
    )
