"""
Serializers for the ai_engine application.

This module provides serializers for AI evaluation data. The ai_engine app
does not own any models — it operates on models defined in the interviews app.
"""

from rest_framework import serializers

from interviews.models import AIEvaluation


class AIEvaluationSerializer(serializers.ModelSerializer):
    """
    Read-only serializer for the ``AIEvaluation`` model.

    Exposes the full evaluation payload including structured feedback
    (strengths, weaknesses, improvements) and the raw AI provider response.
    """

    class Meta:
        model = AIEvaluation
        fields = [
            "id",
            "interview",
            "final_score",
            "scores",
            "verdict",
            "strengths",
            "weaknesses",
            "improvements",
            "raw_response",
            "created_at",
        ]
        read_only_fields = fields


class TriggerEvaluationSerializer(serializers.Serializer):
    """
    Intentionally empty serializer for the evaluation trigger endpoint.

    The ``session_id`` is extracted from the URL path parameter, so the
    request body requires no additional data.  This serializer exists to
    satisfy the DRF ``CreateAPIView`` contract and to serve as a future
    extension point should the trigger endpoint need request-body
    validation.
    """

    pass
