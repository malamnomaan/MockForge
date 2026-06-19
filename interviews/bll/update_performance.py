from django.db.models import Avg, Count
from interviews.models import AIEvaluation, SkillBreakdown
from interviews.services.evaluation_db_service import get_or_create_user_performance, update_user_performance

def update_performance(user):
    """
    Recalculates avg_score, total_attempts, and detects weak_areas for the user.
    """
    perf = get_or_create_user_performance(user)
    
    # Calculate aggregates from AIEvaluation
    evals = AIEvaluation.objects.filter(interview__user=user)
    agg = evals.aggregate(avg=Avg('final_score'), count=Count('id'))
    
    perf.total_attempts = agg['count'] or 0
    perf.avg_score = round(agg['avg'] or 0.0, 2)
    
    last_eval = evals.order_by('-created_at').first()
    if last_eval:
        perf.last_score = last_eval.final_score
        
    # Detect weak areas from SkillBreakdown
    # Find categories where score is consistently low (e.g. < 50 out of 100)
    weak_qs = (
        SkillBreakdown.objects
        .filter(interview__user=user, score__lt=50)
        .values('category')
        .annotate(count=Count('id'))
        .order_by('-count')[:5]
    )
    
    perf.weak_areas = [item['category'] for item in weak_qs]
    
    update_user_performance(perf)
    return perf
