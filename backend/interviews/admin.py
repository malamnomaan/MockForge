from django.contrib import admin

from .models import (
    AIEvaluation, InterviewSession, Status, StatusTransition, 
    SkillBreakdown, UserPerformance
)


# ---------------------------------------------------------------------------
# Status
# ---------------------------------------------------------------------------

@admin.register(Status)
class StatusAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "category", "order", "is_terminal", "is_active")
    list_filter = ("category", "is_terminal", "is_active")
    search_fields = ("code", "name")
    ordering = ("category", "order")


# ---------------------------------------------------------------------------
# Status Transition
# ---------------------------------------------------------------------------

@admin.register(StatusTransition)
class StatusTransitionAdmin(admin.ModelAdmin):
    list_display = ("from_status", "to_status", "is_active")
    list_filter = ("is_active",)
    raw_id_fields = ("from_status", "to_status")


# ---------------------------------------------------------------------------
# Interview Session
# ---------------------------------------------------------------------------

class AIEvaluationInline(admin.TabularInline):
    model = AIEvaluation
    extra = 0
    readonly_fields = ("final_score", "scores", "verdict", "strengths", "weaknesses", "improvements", "created_at")


@admin.register(InterviewSession)
class InterviewSessionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "type", "status", "created_at")
    list_filter = ("type", "status", "created_at")
    search_fields = ("user__email", "question")
    raw_id_fields = ("user", "status")
    ordering = ("-created_at",)
    inlines = [AIEvaluationInline]


# ---------------------------------------------------------------------------
# AI Evaluation
# ---------------------------------------------------------------------------

@admin.register(AIEvaluation)
class AIEvaluationAdmin(admin.ModelAdmin):
    list_display = ("id", "interview", "final_score", "verdict", "created_at")
    list_filter = ("final_score", "verdict", "created_at")
    raw_id_fields = ("interview",)
    ordering = ("-created_at",)


@admin.register(SkillBreakdown)
class SkillBreakdownAdmin(admin.ModelAdmin):
    list_display = ("id", "interview", "category", "score")
    list_filter = ("category",)
    search_fields = ("interview__id", "category")


@admin.register(UserPerformance)
class UserPerformanceAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "avg_score", "total_attempts")
    search_fields = ("user__email",)
