"""
Views for the ai_engine application.

Views are intentionally thin — they handle HTTP concerns (authentication,
response codes, serialization) and delegate all business logic to the
service layer in ``ai_engine.services``.
"""

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ai_engine import services
from ai_engine.bll import interview_agent
from ai_engine.serializers import AIEvaluationSerializer, TriggerEvaluationSerializer
from interviews.bll import trigger_evaluation


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
        
        # Look up session
        session = get_object_or_404(InterviewSession, pk=session_id, user=request.user)
        
        result = trigger_evaluation(session)

        return Response({
            "success": True,
            "data": result
        }, status=status.HTTP_201_CREATED)


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

from django.shortcuts import get_object_or_404
from interviews.models import InterviewSession
from django.http import Http404

class ChatAPIView(APIView):
    """
    POST /api/ai/chat/{session_id}/
    Send a message to the AI interviewer and receive its response.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        session = get_object_or_404(InterviewSession, id=session_id)
        
        # Security: only owner can chat
        if session.user != request.user:
            raise Http404("No Session matches the given query.")
            
        message = request.data.get('message', '')
        if not message:
            return Response(
                {"detail": "Message is required."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        ai_reply = interview_agent.process_interview_chat(session, message)
        
        return Response({
            "reply": ai_reply,
            "chat_history": session.chat_history
        })

