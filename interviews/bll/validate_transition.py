from interviews.models import InterviewSession
from interviews.services.status_service import get_status_by_code
from interviews.services.transition_service import validate_transition
from interviews.services.interview_db_service import update_session

def transition_status(session: InterviewSession, to_status_code: str) -> InterviewSession:
    """
    Validates and executes a status transition.
    """
    to_status = get_status_by_code(to_status_code)
    validate_transition(session.status, to_status)
    
    session.status = to_status
    return update_session(session, ["status"])
