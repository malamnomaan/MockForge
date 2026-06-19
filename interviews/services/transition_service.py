from rest_framework.exceptions import ValidationError
from interviews.models import Status, StatusTransition

def validate_transition(from_status: Status, to_status: Status) -> bool:
    """
    Check if a transition from from_status to to_status is allowed.
    Raises ValidationError if invalid.
    """
    if from_status.is_terminal:
        raise ValidationError(f"Cannot transition from terminal status '{from_status.code}'.")

    is_valid = StatusTransition.objects.filter(
        from_status=from_status,
        to_status=to_status,
        is_active=True,
    ).exists()

    if not is_valid:
        raise ValidationError(f"Invalid transition from '{from_status.code}' to '{to_status.code}'.")

    return True
