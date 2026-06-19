from django.utils import timezone
from interviews.models import InterviewSession
from interviews.services.evaluation_db_service import create_ai_evaluation, create_skill_breakdowns
from .validate_transition import transition_status
from .update_performance import update_performance

def finalize_evaluation(session: InterviewSession, eval_data: dict, raw_response: dict) -> dict:
    """
    Stores AI evaluation, sets status to EVALUATED, and updates performance.
    """
    # Create evaluation records
    evaluation = create_ai_evaluation(session, eval_data, raw_response)
    
    if "scores" in eval_data:
        create_skill_breakdowns(session, eval_data["scores"])
        
    # Update timestamps and status
    session.evaluated_at = timezone.now()
    session.save(update_fields=["evaluated_at"])
    session = transition_status(session, "INTERVIEW_EVALUATED")
    
    # Trigger performance recalculation
    update_performance(session.user)
    
    return {
        "final_score": evaluation.final_score,
        "scores": evaluation.scores,
        "weak_areas": evaluation.weaknesses,
        "improvements": evaluation.improvements,
        "verdict": evaluation.verdict
    }
