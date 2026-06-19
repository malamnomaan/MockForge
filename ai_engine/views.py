"""
Views for the ai_engine application.

Views are intentionally thin — they handle HTTP concerns (authentication,
response codes, serialization) and delegate all business logic to the
service layer in ``ai_engine.services``.
"""

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ai_engine import services
from ai_engine.serializers import AIEvaluationSerializer, TriggerEvaluationSerializer


class TriggerEvaluationView(generics.CreateAPIView):
    """
    Trigger an AI evaluation for the specified interview session.

    **POST** ``/ai/evaluate/<session_id>/``

    The ``session_id`` is taken from the URL path.  The request body can
    be empty — all required data is derived from the session itself.

    Returns the newly created ``AIEvaluation`` serialized with HTTP 201.
    """

    serializer_class = TriggerEvaluationSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        """
        Override the full ``create()`` flow.

        Instead of the standard serializer → save pipeline, we delegate
        to the service layer which owns all business logic and persistence.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session_id = self.kwargs["session_id"]
        evaluation = services.trigger_evaluation(
            session_id=session_id,
            user=request.user,
        )

        output_serializer = AIEvaluationSerializer(evaluation)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


class SessionEvaluationsView(generics.ListAPIView):
    """
    List all AI evaluations for the specified interview session.

    **GET** ``/ai/evaluations/<session_id>/``

    Results are ordered newest-first (``-created_at``).
    """

    serializer_class = AIEvaluationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Delegate queryset construction to the service layer.

        The service verifies ownership and returns evaluations filtered
        by the session identified in the URL.
        """
        session_id = self.kwargs["session_id"]
        return services.get_session_evaluations(
            session_id=session_id,
            user=self.request.user,
        )
