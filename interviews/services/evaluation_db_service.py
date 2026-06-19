from interviews.models import AIEvaluation, SkillBreakdown, UserPerformance

def create_ai_evaluation(interview, eval_data: dict, raw_response: dict) -> AIEvaluation:
    return AIEvaluation.objects.create(
        interview=interview,
        final_score=eval_data.get("final_score", 0),
        scores=eval_data.get("scores", {}),
        strengths=eval_data.get("strengths", []),
        weaknesses=eval_data.get("weaknesses", []),
        improvements=eval_data.get("improvements", []),
        verdict=eval_data.get("verdict", "no_hire"),
        raw_response=raw_response
    )

def create_skill_breakdowns(interview, scores: dict):
    breakdowns = []
    for cat, score in scores.items():
        breakdowns.append(SkillBreakdown(interview=interview, category=cat, score=score))
    SkillBreakdown.objects.bulk_create(breakdowns)

def get_or_create_user_performance(user) -> UserPerformance:
    perf, created = UserPerformance.objects.get_or_create(user=user)
    return perf

def update_user_performance(perf: UserPerformance):
    perf.save()
