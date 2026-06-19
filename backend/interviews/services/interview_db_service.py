from django.db.models import QuerySet
from interviews.models import InterviewSession

def get_user_sessions(user) -> QuerySet[InterviewSession]:
    """Return all InterviewSession records for a user."""
    return (
        InterviewSession.objects
        .filter(user=user)
        .select_related("status")
        .prefetch_related("evaluations", "skill_breakdowns")
        .order_by("-created_at")
    )

def update_session(session: InterviewSession, update_fields: list) -> InterviewSession:
    """Helper to save specific fields on a session."""
    update_fields.append("updated_at")
    session.save(update_fields=list(set(update_fields)))
    return session
