from django.utils import timezone
from interviews.models import InterviewSession
from interviews.services.status_service import get_initial_status
from .validate_transition import transition_status

def start_interview(user, interview_type: str, question: str, language: str = "", difficulty: str = "") -> InterviewSession:
    """
    Creates a new interview and transitions it to IN_PROGRESS.
    """
    initial_status = get_initial_status("INTERVIEW")
    session = InterviewSession.objects.create(
        user=user,
        status=initial_status, # CREATED
        type=interview_type,
        question=question,
        language=language,
        difficulty=difficulty,
    )
    
    # Transition to IN_PROGRESS and set started_at
    session = transition_status(session, "INTERVIEW_IN_PROGRESS")
    session.started_at = timezone.now()
    session.save(update_fields=["started_at"])
    
    return session
