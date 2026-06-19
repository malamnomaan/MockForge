"""
Service layer for the ai_engine application.

All business logic lives here.  Views are thin HTTP controllers that
delegate to these functions.  The current implementation produces **mock**
evaluation data; the real AI provider integration will replace the stub
logic inside ``trigger_evaluation`` in a future iteration.
"""

import random

from django.db.models import QuerySet
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError

from interviews.models import AIEvaluation, InterviewSession


def trigger_evaluation(session_id: int, user) -> AIEvaluation:
    """
    Generate a mock AI evaluation for the given interview session.

    Workflow
    --------
    1. Fetch the ``InterviewSession`` (404 if it does not exist or does
       not belong to *user*).
    2. Validate that the session has a non-empty answer.
    3. Verify the session status is terminal (i.e. ready for evaluation).
    4. Build mock evaluation data and persist an ``AIEvaluation`` record.

    Parameters
    ----------
    session_id : int
        Primary key of the target ``InterviewSession``.
    user : ``AUTH_USER_MODEL`` instance
        The authenticated user making the request.

    Returns
    -------
    AIEvaluation
        The newly created evaluation record.

    Raises
    ------
    django.http.Http404
        If the session does not exist or does not belong to the user.
    rest_framework.exceptions.ValidationError
        If the session has no answer or its status is not terminal.
    """
    session = get_object_or_404(
        InterviewSession,
        pk=session_id,
        user=user,
    )

    # --- Guard: answer must be present -----------------------------------
    if not session.answer:
        raise ValidationError(
            {"answer": "Cannot evaluate a session without an answer."}
        )

    # --- Guard: session must be in a terminal status ---------------------
    if not session.status.is_terminal:
        raise ValidationError(
            {
                "status": (
                    f"Session status '{session.status.code}' is not terminal. "
                    "Only completed sessions can be evaluated."
                )
            }
        )

    # --- Mock evaluation data (stub) -------------------------------------
    score = random.randint(40, 95)

    strengths = [
        "Good problem decomposition",
        "Clean code structure",
        "Efficient time complexity",
    ]

    weaknesses = [
        "Could improve space complexity",
        "Edge cases not fully covered",
    ]

    improvements = [
        "Practice more graph problems",
        "Review dynamic programming patterns",
        "Work on explaining thought process",
    ]

    raw_response = {
        "model": "mock-gpt-4",
        "usage": {
            "prompt_tokens": 500,
            "completion_tokens": 300,
        },
        "mock": True,
    }

    # --- Persist and return ----------------------------------------------
    evaluation = AIEvaluation.objects.create(
        interview=session,
        score=score,
        strengths=strengths,
        weaknesses=weaknesses,
        improvements=improvements,
        raw_response=raw_response,
    )

    return evaluation


def get_session_evaluations(session_id: int, user) -> QuerySet:
    """
    Return all AI evaluations for a session, newest first.

    Parameters
    ----------
    session_id : int
        Primary key of the target ``InterviewSession``.
    user : ``AUTH_USER_MODEL`` instance
        The authenticated user making the request.

    Returns
    -------
    QuerySet[AIEvaluation]
        Evaluations ordered by ``-created_at``.

    Raises
    ------
    django.http.Http404
        If the session does not exist or does not belong to the user.
    """
    get_object_or_404(
        InterviewSession,
        pk=session_id,
        user=user,
    )

    return AIEvaluation.objects.filter(
        interview_id=session_id,
    ).order_by("-created_at")
