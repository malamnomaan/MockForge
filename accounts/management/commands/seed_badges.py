from django.core.management.base import BaseCommand
from accounts.models import Badge

class Command(BaseCommand):
    help = 'Seeds the database with default badges'

    def handle(self, *args, **kwargs):
        badges_def = [
            # Streaks
            {"code": "streak_5", "name": "5 Day Streak", "category": "streak", "icon": "Flame", "color": "#f97316", "requirement": 5, "description": "Maintain an active streak for 5 consecutive days."},
            {"code": "streak_10", "name": "10 Day Streak", "category": "streak", "icon": "Flame", "color": "#f97316", "requirement": 10, "description": "Maintain an active streak for 10 consecutive days."},
            {"code": "streak_20", "name": "20 Day Streak", "category": "streak", "icon": "Flame", "color": "#f97316", "requirement": 20, "description": "Maintain an active streak for 20 consecutive days."},
            {"code": "streak_50", "name": "50 Day Streak", "category": "streak", "icon": "Flame", "color": "#f97316", "requirement": 50, "description": "Maintain an active streak for 50 consecutive days."},
            {"code": "streak_100", "name": "100 Day Streak", "category": "streak", "icon": "Flame", "color": "#f97316", "requirement": 100, "description": "Maintain an active streak for 100 consecutive days."},
            {"code": "streak_500", "name": "500 Day Streak", "category": "streak", "icon": "Flame", "color": "#f97316", "requirement": 500, "description": "Maintain an active streak for a massive 500 consecutive days."},
            
            # Problems (Learning)
            {"code": "prob_1", "name": "First Code", "category": "learning", "icon": "Code", "color": "#10b981", "requirement": 1, "description": "Successfully solve your first coding problem."},
            {"code": "prob_10", "name": "Problem Solver", "category": "learning", "icon": "Terminal", "color": "#10b981", "requirement": 10, "description": "Successfully solve 10 unique coding problems."},
            {"code": "prob_50", "name": "Code Warrior", "category": "learning", "icon": "TerminalSquare", "color": "#10b981", "requirement": 50, "description": "Successfully solve 50 unique coding problems."},
            {"code": "prob_100", "name": "Algorithm Master", "category": "learning", "icon": "Cpu", "color": "#10b981", "requirement": 100, "description": "Successfully solve 100 unique coding problems. You are a master!"},
            
            # Interviews (Cracking)
            {"code": "int_1", "name": "Ice Breaker", "category": "cracking", "icon": "Mic", "color": "#3b82f6", "requirement": 1, "description": "Complete your first AI Mock Interview."},
            {"code": "int_5", "name": "Confident Speaker", "category": "cracking", "icon": "MessageSquare", "color": "#3b82f6", "requirement": 5, "description": "Complete 5 AI Mock Interviews."},
            {"code": "int_20", "name": "Interview Veteran", "category": "cracking", "icon": "Award", "color": "#3b82f6", "requirement": 20, "description": "Complete 20 AI Mock Interviews."},
            {"code": "int_50", "name": "System Design Pro", "category": "cracking", "icon": "Trophy", "color": "#3b82f6", "requirement": 50, "description": "Complete 50 AI Mock Interviews. You are ready for anything!"},
        ]
        
        for b in badges_def:
            Badge.objects.update_or_create(
                code=b["code"],
                defaults={
                    "name": b["name"],
                    "description": b["description"],
                    "category": b["category"],
                    "icon": b["icon"],
                    "color": b["color"],
                    "requirement": b["requirement"]
                }
            )
        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(badges_def)} badges.'))
