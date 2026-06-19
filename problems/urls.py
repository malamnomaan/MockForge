from django.urls import path
from .views import LevelListView, ProblemListView, ProblemDetailView, SubmitProblemView, RunProblemView, SubmissionListView

app_name = 'problems'

urlpatterns = [
    path('levels/', LevelListView.as_view(), name='level-list'),
    path('level/<int:level_id>/', ProblemListView.as_view(), name='problem-list'),
    path('<int:pk>/', ProblemDetailView.as_view(), name='problem-detail'),
    path('<int:problem_id>/run/', RunProblemView.as_view(), name='run-problem'),
    path('<int:problem_id>/submit/', SubmitProblemView.as_view(), name='submit-problem'),
    path('submissions/', SubmissionListView.as_view(), name='submission-list'),
]
