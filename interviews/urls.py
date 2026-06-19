"""
URL configuration for the interviews application.

Routes are split between:
* A DRF :class:`DefaultRouter` for the :class:`InterviewSessionViewSet`.
* Manually declared paths for status list / detail / transition views.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    InterviewSessionViewSet,
    StatusDetailView,
    StatusListView,
    StatusTransitionsView,
)

app_name = "interviews"

router = DefaultRouter()
router.register(r"sessions", InterviewSessionViewSet, basename="session")

urlpatterns = [
    path("statuses/", StatusListView.as_view(), name="status-list"),
    path("statuses/<str:code>/", StatusDetailView.as_view(), name="status-detail"),
    path(
        "statuses/<str:code>/transitions/",
        StatusTransitionsView.as_view(),
        name="status-transitions",
    ),
    path("", include(router.urls)),
]
