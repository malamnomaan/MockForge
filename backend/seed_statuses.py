import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mockforge.settings')
django.setup()

from interviews.models import Status, StatusTransition

def seed():
    # Create statuses
    s1, _ = Status.objects.get_or_create(
        code="INTERVIEW_CREATED",
        defaults={"name": "Created", "category": "INTERVIEW", "order": 0, "is_terminal": False}
    )
    s2, _ = Status.objects.get_or_create(
        code="INTERVIEW_IN_PROGRESS",
        defaults={"name": "In Progress", "category": "INTERVIEW", "order": 1, "is_terminal": False}
    )
    s3, _ = Status.objects.get_or_create(
        code="INTERVIEW_SUBMITTED",
        defaults={"name": "Submitted", "category": "INTERVIEW", "order": 2, "is_terminal": False}
    )
    s4, _ = Status.objects.get_or_create(
        code="INTERVIEW_EVALUATED",
        defaults={"name": "Evaluated", "category": "INTERVIEW", "order": 3, "is_terminal": True}
    )

    # Create transitions
    StatusTransition.objects.get_or_create(from_status=s1, to_status=s2)
    StatusTransition.objects.get_or_create(from_status=s2, to_status=s3)
    StatusTransition.objects.get_or_create(from_status=s3, to_status=s4)
    # Also allow skipping in progress if they just submit immediately
    StatusTransition.objects.get_or_create(from_status=s1, to_status=s3)
    # The InterviewWorkspace UI does SUBMITTED -> EVALUATED directly.
    
    print("Statuses seeded successfully!")

if __name__ == '__main__':
    seed()
