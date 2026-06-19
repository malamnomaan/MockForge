"""
URL configuration for the ai_engine application.

Routes
------
- ``evaluate/<int:session_id>/``  — trigger a new AI evaluation (POST)
- ``evaluations/<int:session_id>/`` — list evaluations for a session (GET)
"""

from django.urls import path

from ai_engine.views import SessionEvaluationsView, TriggerEvaluationView, ChatAPIView

app_name = "ai_engine"

urlpatterns = [
    path(
        "evaluate/<int:session_id>/",
        TriggerEvaluationView.as_view(),
        name="trigger-evaluation",
    ),
    path(
        "evaluations/<int:session_id>/",
        SessionEvaluationsView.as_view(),
        name="session-evaluations",
    ),
    path(
        'chat/<int:session_id>/',
        ChatAPIView.as_view(),
        name='session-chat'
    ),
]
