"""
Views (thin HTTP controllers) for the interviews application.

All business logic is delegated to :mod:`interviews.services`.
Views are responsible only for request handling, permission checks,
and serializer orchestration.
"""

from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import InterviewSession, Status
from .services.status_service import get_valid_transitions
from .services.interview_db_service import get_user_sessions
from .services.execute_service import execute_code
from .models import InterviewSession, Status
from .serializers import (
    InterviewSessionCreateSerializer,
    InterviewSessionDetailSerializer,
    InterviewSessionListSerializer,
    InterviewSessionUpdateSerializer,
    StatusSerializer,
    StatusTransitionActionSerializer,
    StatusTransitionSerializer,
)
from .bll import start_interview, submit_answer


# ---------------------------------------------------------------------------
# Status views
# ---------------------------------------------------------------------------

class StatusListView(generics.ListAPIView):
    """
    List all active statuses.

    Returns a paginated collection of :model:`interviews.Status` records
    where ``is_active=True``, ordered by category and display order.
    """

    queryset = Status.objects.filter(is_active=True)
    serializer_class = StatusSerializer


class StatusDetailView(generics.RetrieveAPIView):
    """
    Retrieve a single active status by its unique ``code``.

    Uses ``code`` as the lookup field instead of the default ``pk``.
    """

    queryset = Status.objects.filter(is_active=True)
    serializer_class = StatusSerializer
    lookup_field = "code"


class StatusTransitionsView(generics.ListAPIView):
    """
    List valid outgoing transitions from a given status.

    The status is identified by its ``code`` URL parameter. Returns
    all active :model:`interviews.StatusTransition` records originating
    from that status, with nested ``from_status`` and ``to_status``
    representations.
    """

    serializer_class = StatusTransitionSerializer

    def get_queryset(self):
        """Look up the source status by URL code and delegate to the service."""
        status_obj = get_object_or_404(
            Status,
            code=self.kwargs["code"],
            is_active=True,
        )
        return get_valid_transitions(status_obj)


# ---------------------------------------------------------------------------
# Interview Session ViewSet
# ---------------------------------------------------------------------------

class InterviewSessionViewSet(viewsets.ModelViewSet):
    """
    CRUD + workflow actions for :model:`interviews.InterviewSession`.

    Supported operations:
        * **list** — paginated sessions for the authenticated user.
        * **create** — start a new interview session.
        * **retrieve** — full session detail including evaluations.
        * **partial_update** (PATCH) — submit / update the answer.
        * **transition** (POST, detail) — advance the session status.

    PUT is intentionally disabled; use PATCH for partial updates.
    """

    # Disable PUT — only PATCH is allowed for updates.
    http_method_names = ["get", "post", "patch", "head", "options"]

    # --- Serializer routing --------------------------------------------------

    _action_serializer_map: dict = {
        "list": InterviewSessionListSerializer,
        "create": InterviewSessionCreateSerializer,
        "retrieve": InterviewSessionDetailSerializer,
        "partial_update": InterviewSessionUpdateSerializer,
        "transition": StatusTransitionActionSerializer,
    }

    def get_serializer_class(self):
        """Return the serializer class appropriate for the current action."""
        return self._action_serializer_map.get(
            self.action,
            InterviewSessionListSerializer,
        )

    # --- QuerySet scoping ----------------------------------------------------

    def get_queryset(self):
        """
        Scope queryset to the authenticated user only.

        Uses :func:`services.get_user_sessions` which applies
        ``select_related`` and ``prefetch_related`` optimisations.
        """
        return get_user_sessions(self.request.user)

    # --- Standard Overrides --------------------------------------------------
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "success": True,
            "data": serializer.data
        })
        
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            "success": True,
            "data": serializer.data
        })

    # --- Create --------------------------------------------------------------

    def perform_create(self, serializer):
        """
        Persist a new session via the serializer's ``create()`` which
        internally delegates to the service layer.
        """
        serializer.save()

    def create(self, request, *args, **kwargs):
        """
        Start a new interview session.
        Delegates to BLL.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        session = start_interview(
            user=request.user,
            interview_type=serializer.validated_data.get("type"),
            question=serializer.validated_data.get("question"),
            language=serializer.validated_data.get("language", ""),
            difficulty=serializer.validated_data.get("difficulty", "")
        )

        detail_serializer = InterviewSessionDetailSerializer(
            session,
            context=self.get_serializer_context(),
        )
        return Response({
            "success": True,
            "data": detail_serializer.data
        }, status=status.HTTP_201_CREATED)
        
    def partial_update(self, request, *args, **kwargs):
        """
        Submit / update answer using BLL.
        """
        session = self.get_object()
        serializer = self.get_serializer(session, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        answer = serializer.validated_data.get("answer", session.answer)
        violations = serializer.validated_data.get("violations", session.violations)
        
        updated_session = submit_answer(session, answer, violations)
        
        detail_serializer = InterviewSessionDetailSerializer(
            updated_session,
            context=self.get_serializer_context(),
        )
        return Response({
            "success": True,
            "data": detail_serializer.data
        })

    # --- Custom action: transition -------------------------------------------

    @action(detail=True, methods=["post"], url_path="transition")
    def transition(self, request, pk=None):
        """
        Advance the session's status to a new state.

        Expects a JSON body with ``to_status_code``. The service layer
        validates the transition and updates the session accordingly.
        """
        session = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from interviews.bll.validate_transition import transition_status
        updated_session = transition_status(
            session=session,
            to_status_code=serializer.validated_data["to_status_code"],
        )

        detail_serializer = InterviewSessionDetailSerializer(
            updated_session,
            context=self.get_serializer_context(),
        )
        return Response({
            "success": True,
            "data": detail_serializer.data
        })


class ExecuteCodeView(APIView):
    """
    POST /api/interviews/execute/
    Executes a given set of files and returns standard output/error.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        language = request.data.get("language")
        files = request.data.get("files", [])
        
        if not language or not files:
            return Response(
                {"detail": "Language and files array are required."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        result = execute_code(language, files)
        return Response(result)
