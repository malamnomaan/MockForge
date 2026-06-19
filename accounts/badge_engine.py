from django.utils import timezone
from problems.models import UserProblemSubmission
from interviews.models import InterviewSession

from accounts.models import Badge

def get_user_achievements(user):
    # 1. Fetch data
    interviews = list(InterviewSession.objects.filter(user=user).order_by('created_at'))
    submissions = list(UserProblemSubmission.objects.filter(user=user, passed=True).order_by('created_at'))
    
    # Calculate exact date for Nth problem
    unique_problems_solved = set()
    problem_milestone_dates = {}
    for sub in submissions:
        if sub.problem_id not in unique_problems_solved:
            unique_problems_solved.add(sub.problem_id)
            count = len(unique_problems_solved)
            if count in [1, 10, 50, 100]:
                problem_milestone_dates[count] = sub.created_at.date().isoformat()
                
    # Calculate exact date for Nth interview
    interview_milestone_dates = {}
    for i, it in enumerate(interviews):
        count = i + 1
        if count in [1, 5, 20, 50]:
            interview_milestone_dates[count] = it.created_at.date().isoformat()
            
    total_interviews = len(interviews)
    total_problems = len(unique_problems_solved)
    
    # Calculate Streak
    # Combine dates of any activity
    activity_dates = set()
    for it in interviews:
        activity_dates.add(it.created_at.date())
    for sub in submissions:
        activity_dates.add(sub.created_at.date())
        
    sorted_dates = sorted(list(activity_dates), reverse=True)
    
    current_streak = 0
    today = timezone.now().date()
    
    # Simple streak logic backwards from today or yesterday
    if sorted_dates:
        if sorted_dates[0] == today or sorted_dates[0] == today - timezone.timedelta(days=1):
            current_streak = 1
            for i in range(1, len(sorted_dates)):
                if sorted_dates[i-1] - sorted_dates[i] == timezone.timedelta(days=1):
                    current_streak += 1
                else:
                    break
    
    max_streak = current_streak # This is just current streak. For max streak, we'd need to calculate all historical streaks.
    # Let's calculate max streak properly and track milestone dates
    historical_max_streak = 0
    temp_streak = 0
    streak_milestone_dates = {}
    if sorted_dates:
        sorted_asc = sorted(list(activity_dates))
        temp_streak = 1
        historical_max_streak = 1
        streak_milestone_dates[1] = sorted_asc[0].isoformat()
        for i in range(1, len(sorted_asc)):
            if sorted_asc[i] - sorted_asc[i-1] == timezone.timedelta(days=1):
                temp_streak += 1
                historical_max_streak = max(historical_max_streak, temp_streak)
                if temp_streak in [5, 10, 20, 50, 100, 500] and temp_streak not in streak_milestone_dates:
                    streak_milestone_dates[temp_streak] = sorted_asc[i].isoformat()
            else:
                temp_streak = 1
    
    # 2. Query Badges
    badges_db = Badge.objects.all()
    
    # Evaluate Badges
    badges = []
    for b in badges_db:
        # Determine current value
        current = 0
        if b.category == 'streak':
            current = historical_max_streak
        elif b.category == 'learning':
            current = total_problems
        elif b.category == 'cracking':
            current = total_interviews

        earned = current >= b.requirement
        progress = min(100, int((current / b.requirement) * 100)) if b.requirement > 0 else 100
        left = max(0, b.requirement - current)
        
        unlocked_date = None
        if earned:
            if b.category == "streak":
                unlocked_date = streak_milestone_dates.get(b.requirement)
            elif b.category == "learning":
                unlocked_date = problem_milestone_dates.get(b.requirement)
            elif b.category == "cracking":
                unlocked_date = interview_milestone_dates.get(b.requirement)

        badges.append({
            "id": b.code,
            "name": b.name,
            "description": b.description,
            "category": b.category,
            "icon": b.icon,
            "color": b.color,
            "earned": earned,
            "progress": progress,
            "current": current,
            "requirement": b.requirement,
            "left": left,
            "unlocked_date": unlocked_date
        })
        
    # Sort badges: earned first, then by percentage progress
    badges.sort(key=lambda x: (0 if x['earned'] else 1, -x['progress']))
        
    return {
        "stats": {
            "total_interviews": total_interviews,
            "total_problems": total_problems,
            "current_streak": current_streak,
            "max_streak": historical_max_streak
        },
        "badges": badges
    }
