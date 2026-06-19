from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError
from interviews.models import Status

def get_status_by_code(code: str) -> Status:
    """Fetch an active status by code or 404."""
    return get_object_or_404(Status, code=code, is_active=True)

def get_initial_status(category: str = "INTERVIEW") -> Status:
    """Fetch the lowest order active status for a category."""
    status = Status.objects.filter(category=category, is_active=True).order_by("order").first()
    if status is None:
        raise ValidationError(f"No active initial status found for category '{category}'.")
    return status

def get_valid_transitions(status: Status):
    from interviews.models import StatusTransition
    return (
        StatusTransition.objects
        .filter(from_status=status, is_active=True)
        .select_related("from_status", "to_status")
    )
