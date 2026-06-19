"""
Business-logic layer for the interviews application.

Every mutating or query-intensive operation lives here so that views stay
thin HTTP controllers and serializers handle only validation / representation.
"""

import os
import json
import tempfile
import subprocess
from django.contrib.auth import get_user_model
from django.db.models import QuerySet
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError

from .models import AIEvaluation, InterviewSession, Status, StatusTransition

User = get_user_model()


# ---------------------------------------------------------------------------
# Status helpers
# ---------------------------------------------------------------------------

def get_initial_status(category: str = "INTERVIEW") -> Status:
    """
    Return the first active ``Status`` for the given *category* (lowest
    ``order`` value).

    Raises:
        ValidationError: If no active status exists for the category.
    """
    status = (
        Status.objects
        .filter(category=category, is_active=True)
        .order_by("order")
        .first()
    )
    if status is None:
        raise ValidationError(
            f"No active initial status found for category '{category}'."
        )
    return status


def get_valid_transitions(status: Status) -> QuerySet[StatusTransition]:
    """
    Return active ``StatusTransition`` objects originating from *status*.

    The related ``to_status`` is eagerly loaded to avoid N+1 queries when
    serialising the result set.
    """
    return (
        StatusTransition.objects
        .filter(from_status=status, is_active=True)
        .select_related("from_status", "to_status")
    )


# ---------------------------------------------------------------------------
# Interview session CRUD
# ---------------------------------------------------------------------------

def create_session(
    user,
    interview_type: str,
    question: str,
    language: str = "",
    difficulty: str = "",
) -> InterviewSession:
    """
    Create a new ``InterviewSession`` for *user*.
    ...
    """
    initial_status = get_initial_status(category="INTERVIEW")
    return InterviewSession.objects.create(
        user=user,
        status=initial_status,
        type=interview_type,
        question=question,
        language=language,
        difficulty=difficulty,
    )


def update_session(
    session: InterviewSession,
    validated_data: dict,
) -> InterviewSession:
    """
    Apply *validated_data* fields (typically just ``answer``) to *session*
    and persist changes.

    Args:
        session: The ``InterviewSession`` to update.
        validated_data: A dict of field names → values (already validated).

    Returns:
        The updated ``InterviewSession`` instance.
    """
    for field, value in validated_data.items():
        setattr(session, field, value)
    session.save(update_fields=[*validated_data.keys(), "updated_at"])
    return session


# ---------------------------------------------------------------------------
# Status transitions
# ---------------------------------------------------------------------------

def transition_status(
    session: InterviewSession,
    to_status_code: str,
) -> InterviewSession:
    """
    Transition *session* from its current status to the status identified
    by *to_status_code*.

    Validations performed:
        1. The target status must exist.
        2. The current status must **not** be terminal.
        3. An active ``StatusTransition`` edge must exist between the
           current status and the target status.

    Args:
        session: The interview session whose status should change.
        to_status_code: The ``code`` of the desired target ``Status``.

    Returns:
        The updated ``InterviewSession`` with the new status.

    Raises:
        Http404: If *to_status_code* does not match any ``Status``.
        ValidationError: If the transition is not permitted.
    """
    to_status = get_object_or_404(Status, code=to_status_code)

    if session.status.is_terminal:
        raise ValidationError(
            f"Cannot transition from terminal status "
            f"'{session.status.code}'."
        )

    is_valid = StatusTransition.objects.filter(
        from_status=session.status,
        to_status=to_status,
        is_active=True,
    ).exists()

    if not is_valid:
        raise ValidationError(
            f"Invalid transition from '{session.status.code}' "
            f"to '{to_status_code}'."
        )

    session.status = to_status
    session.save(update_fields=["status", "updated_at"])
    return session


# ---------------------------------------------------------------------------
# Query helpers
# ---------------------------------------------------------------------------

def get_user_sessions(user) -> QuerySet[InterviewSession]:
    """
    Return all ``InterviewSession`` records belonging to *user*.

    The query eagerly loads the related ``status`` and prefetches
    ``evaluations`` to prevent N+1 queries in list views.

    Results are ordered newest-first (``-created_at``).
    """
    return (
        InterviewSession.objects
        .filter(user=user)
        .select_related("status")
        .prefetch_related("evaluations")
        .order_by("-created_at")
    )


# ---------------------------------------------------------------------------
# Code Execution
# ---------------------------------------------------------------------------

def execute_code(language: str, files: list) -> dict:
    """
    Securely execute code in a temporary directory.
    Uses subprocess with a 5-second timeout to prevent infinite loops.
    """
    with tempfile.TemporaryDirectory() as temp_dir:
        # Write files to disk
        for f in files:
            file_path = os.path.join(temp_dir, f.get("name", "main.txt"))
            with open(file_path, "w", encoding="utf-8") as out:
                out.write(f.get("content", ""))
                
        # Determine execution command
        lang = language.lower()
        cmd = []
        is_shell = False
        
        if lang == "python":
            main_file = next((f["name"] for f in files if f["name"].endswith(".py")), "main.py")
            cmd = ["python", main_file]
        elif lang in ["javascript", "js", "typescript", "ts"]:
            main_file = next((f["name"] for f in files if f["name"].endswith(".js") or f["name"].endswith(".ts")), "main.js")
            cmd = ["node", main_file]
        elif lang == "java":
            main_file = next((f["name"] for f in files if f["name"].endswith(".java")), "Solution.java")
            main_class = main_file.replace(".java", "")
            cmd = f"javac *.java && java {main_class}"
            is_shell = True
        elif lang in ["c++", "cpp"]:
            cmd = "g++ *.cpp -o a.out && ./a.out"
            is_shell = True
        elif lang == "go":
            cmd = "go run ."
            is_shell = True
        else:
            return {"output": f"Execution for language '{language}' is not supported locally.", "error": True}

        try:
            if is_shell:
                result = subprocess.run(cmd, shell=True, cwd=temp_dir, capture_output=True, text=True, timeout=5)
            else:
                result = subprocess.run(cmd, cwd=temp_dir, capture_output=True, text=True, timeout=5)
                
            output = result.stdout + result.stderr
            return {"output": output.strip() or "Success (No Output)", "error": result.returncode != 0}
            
        except subprocess.TimeoutExpired:
            return {"output": "Error: Execution Timed Out (5 seconds limit exceeded).", "error": True}
        except Exception as e:
            return {"output": f"Execution Failed: {str(e)}\n\n(Note: Ensure compilers like node/java/g++ are installed on the host machine)", "error": True}
