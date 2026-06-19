from django.utils import timezone
from interviews.models import InterviewSession
from .validate_transition import transition_status

def submit_answer(session: InterviewSession, answer: str, violations: int = 0) -> InterviewSession:
    """
    Saves the user's answer, tracks time taken, and sets status to SUBMITTED.
    """
    session.answer = answer
    if violations > 0:
        session.violations = violations
        
    session.submitted_at = timezone.now()
    if session.started_at:
        delta = session.submitted_at - session.started_at
        session.time_taken_seconds = int(delta.total_seconds())
        
    session.save(update_fields=["answer", "violations", "submitted_at", "time_taken_seconds"])
    
    if session.status.code != "INTERVIEW_SUBMITTED":
        return transition_status(session, "INTERVIEW_SUBMITTED")
        
    return session
