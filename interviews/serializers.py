"""
DRF serializers for the interviews application.

Serializers are responsible for validation and representation only.
All business logic is delegated to :mod:`interviews.services`.
"""

from rest_framework import serializers

from . import services
from .models import AIEvaluation, InterviewSession, Status, StatusTransition


# ---------------------------------------------------------------------------
# Status
# ---------------------------------------------------------------------------

class StatusSerializer(serializers.ModelSerializer):
    """Read-only serializer for the :model:`interviews.Status` master table."""

    class Meta:
        model = Status
        fields = [
            "id",
            "code",
            "name",
            "category",
            "order",
            "is_terminal",
            "is_active",
            "created_at",
        ]
        read_only_fields = fields


# ---------------------------------------------------------------------------
# Status Transition
# ---------------------------------------------------------------------------

class StatusTransitionSerializer(serializers.ModelSerializer):
    """
    Read-only serializer for :model:`interviews.StatusTransition`.

    Both ``from_status`` and ``to_status`` are rendered as nested
    :class:`StatusSerializer` representations.
    """

    from_status = StatusSerializer(read_only=True)
    to_status = StatusSerializer(read_only=True)

    class Meta:
        model = StatusTransition
        fields = [
            "id",
            "from_status",
            "to_status",
            "is_active",
        ]
        read_only_fields = fields


# ---------------------------------------------------------------------------
# AI Evaluation
# ---------------------------------------------------------------------------

class AIEvaluationSerializer(serializers.ModelSerializer):
    """Read-only serializer for :model:`interviews.AIEvaluation`."""

    class Meta:
        model = AIEvaluation
        fields = [
            "id",
            "interview",
            "score",
            "strengths",
            "weaknesses",
            "improvements",
            "raw_response",
            "created_at",
        ]
        read_only_fields = fields


# ---------------------------------------------------------------------------
# Interview Session — List / Detail
# ---------------------------------------------------------------------------

class InterviewSessionListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer used for interview session list views.

    Includes only the fields necessary for rendering table rows or cards.
    The ``user`` field is represented as the user's string representation
    (typically the email address).
    """

    user = serializers.StringRelatedField(read_only=True)
    status = StatusSerializer(read_only=True)
    get_type_display = serializers.CharField(
        read_only=True,
    )
    evaluations = AIEvaluationSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = InterviewSession
        fields = [
            "id",
            "user",
            "status",
            "type",
            "get_type_display",
            "language",
            "difficulty",
            "violations",
            "created_at",
            "evaluations",
        ]
        read_only_fields = fields


class InterviewSessionDetailSerializer(InterviewSessionListSerializer):
    """
    Extended serializer for the interview session detail view.

    Includes the question, answer, ``updated_at`` timestamp, and all
    related AI evaluations.
    """

    class Meta(InterviewSessionListSerializer.Meta):
        fields = InterviewSessionListSerializer.Meta.fields + [
            "question",
            "answer",
            "chat_history",
            "updated_at",
        ]
        read_only_fields = fields


# ---------------------------------------------------------------------------
# Interview Session — Create / Update
# ---------------------------------------------------------------------------

class InterviewSessionCreateSerializer(serializers.Serializer):
    """
    Accepts the data required to start a new interview session.

    Business logic (initial status assignment, persistence) is delegated
    to :func:`interviews.services.create_session`.
    """

    type = serializers.ChoiceField(
        choices=InterviewSession.InterviewType.choices,
        help_text="The type of interview to start.",
    )
    question = serializers.CharField(
        help_text="The interview question text.",
    )
    language = serializers.CharField(required=False, allow_blank=True)
    difficulty = serializers.CharField(required=False, allow_blank=True)

    def create(self, validated_data):
        """Delegate session creation to the service layer."""
        user = self.context["request"].user
        return services.create_session(
            user=user,
            interview_type=validated_data["type"],
            question=validated_data["question"],
            language=validated_data.get("language", ""),
            difficulty=validated_data.get("difficulty", ""),
        )


class InterviewSessionUpdateSerializer(serializers.ModelSerializer):
    """
    Accepts only the ``answer`` field for submitting or updating a
    candidate's answer on an existing session.
    """

    class Meta:
        model = InterviewSession
        fields = ["answer", "violations"]

    def update(self, instance, validated_data):
        """Delegate session update to the service layer."""
        return services.update_session(instance, validated_data)


# ---------------------------------------------------------------------------
# Status Transition Action
# ---------------------------------------------------------------------------

class StatusTransitionActionSerializer(serializers.Serializer):
    """
    Accepts a ``to_status_code`` and transitions the interview session
    to the corresponding status.

    Validation is performed by the service layer which checks:
    * The target status exists.
    * The current status is not terminal.
    * A valid, active transition edge exists.
    """

    to_status_code = serializers.CharField(
        help_text="The code of the target status to transition to.",
    )

    def validate_to_status_code(self, value: str) -> str:
        """Ensure the target status code exists in the database."""
        if not Status.objects.filter(code=value).exists():
            raise serializers.ValidationError(
                f"Status with code '{value}' does not exist."
            )
        return value
