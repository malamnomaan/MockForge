from interviews.models import InterviewSession
from ai_engine.bll.evaluator_agent import generate_evaluation
from .validate_transition import transition_status
from .finalize_evaluation import finalize_evaluation

def trigger_evaluation(session: InterviewSession) -> dict:
    """
    Transitions to EVALUATING, calls the AI service, and then finalizes.
    """
    session = transition_status(session, "INTERVIEW_EVALUATING")
    
    # Call AI service
    eval_data = generate_evaluation(session)
    
    # Delegate to finalize
    return finalize_evaluation(session, eval_data, eval_data)
