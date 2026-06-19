from django.conf import settings
from django.db import models


# ---------------------------------------------------------------------------
# Status (Master Table)
# ---------------------------------------------------------------------------

class Status(models.Model):
    """
    Workflow-driven master status table.
    Statuses are categorised (e.g. INTERVIEW, USER) and ordered to support
    deterministic workflow progressions.
    """

    class Category(models.TextChoices):
        INTERVIEW = "INTERVIEW", "Interview"
        USER = "USER", "User"

    code = models.CharField(
        "status code",
        max_length=50,
        unique=True,
        db_index=True,
        help_text="Machine-readable code, e.g. INTERVIEW_STARTED.",
    )
    name = models.CharField(
        "display name",
        max_length=100,
        help_text="Human-readable label shown in the UI.",
    )
    category = models.CharField(
        "category",
        max_length=30,
        choices=Category.choices,
        db_index=True,
        help_text="Logical grouping for this status.",
    )
    order = models.PositiveIntegerField(
        "display order",
        default=0,
        help_text="Determines display / workflow ordering.",
    )
    is_terminal = models.BooleanField(
        "terminal state",
        default=False,
        help_text="If True, no further transitions are allowed from this status.",
    )
    is_active = models.BooleanField(
        "active",
        default=True,
        help_text="Soft-delete flag — inactive statuses are hidden from new workflows.",
    )
    created_at = models.DateTimeField("created at", auto_now_add=True)

    class Meta:
        db_table = "interviews_status"
        ordering = ["category", "order"]
        verbose_name = "status"
        verbose_name_plural = "statuses"
        indexes = [
            models.Index(fields=["category", "order"], name="idx_status_cat_order"),
        ]

    def __str__(self):
        return f"{self.category} — {self.name} ({self.code})"


# ---------------------------------------------------------------------------
# Status Transition
# ---------------------------------------------------------------------------

class StatusTransition(models.Model):
    """
    Defines valid status-to-status transitions.
    Acts as a state-machine edge table — only transitions listed here are
    permitted by the workflow engine.
    """

    from_status = models.ForeignKey(
        Status,
        on_delete=models.PROTECT,
        related_name="transitions_from",
        verbose_name="from status",
    )
    to_status = models.ForeignKey(
        Status,
        on_delete=models.PROTECT,
        related_name="transitions_to",
        verbose_name="to status",
    )
    is_active = models.BooleanField(
        "active",
        default=True,
        help_text="Inactive transitions are not considered by the workflow engine.",
    )

    class Meta:
        db_table = "interviews_status_transition"
        ordering = ["from_status", "to_status"]
        verbose_name = "status transition"
        verbose_name_plural = "status transitions"
        constraints = [
            models.UniqueConstraint(
                fields=["from_status", "to_status"],
                name="uq_status_transition",
            ),
        ]

    def __str__(self):
        return f"{self.from_status.code} → {self.to_status.code}"


# ---------------------------------------------------------------------------
# Interview Session
# ---------------------------------------------------------------------------

class InterviewSession(models.Model):
    """
    Core interview record linking a user to a question, answer, and
    current workflow status.
    """

    class InterviewType(models.TextChoices):
        DSA = "DSA", "Data Structures & Algorithms"
        SYSTEM_DESIGN = "SYSTEM_DESIGN", "System Design"
        RAPID_FIRE = "RAPID_FIRE", "Rapid Fire QnA"
        SKILL_BASED = "SKILL_BASED", "Skill Based"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="interview_sessions",
        verbose_name="user",
    )
    status = models.ForeignKey(
        Status,
        on_delete=models.PROTECT,
        related_name="interview_sessions",
        verbose_name="status",
    )
    type = models.CharField(
        "interview type",
        max_length=30,
        choices=InterviewType.choices,
    )
    language = models.CharField("language", max_length=50, blank=True, null=True, help_text="Programming language (e.g., Python, Java)")
    difficulty = models.CharField("difficulty", max_length=50, blank=True, null=True, help_text="Experience level mapping (e.g., Easy, Expert)")
    question = models.TextField("question")
    answer = models.TextField("answer", blank=True, null=True)
    chat_history = models.JSONField(
        "chat history",
        default=list,
        blank=True,
        help_text="Stores the conversation history with the AI agent.",
    )
    violations = models.PositiveIntegerField("violations", default=0, help_text="Number of anti-cheat violations detected.")
    created_at = models.DateTimeField("created at", auto_now_add=True)
    updated_at = models.DateTimeField("updated at", auto_now=True)

    class Meta:
        db_table = "interviews_session"
        ordering = ["-created_at"]
        verbose_name = "interview session"
        verbose_name_plural = "interview sessions"
        indexes = [
            models.Index(fields=["user"], name="idx_session_user"),
            models.Index(fields=["status"], name="idx_session_status"),
            models.Index(fields=["-created_at"], name="idx_session_created"),
            models.Index(fields=["user", "status"], name="idx_session_user_status"),
        ]

    def __str__(self):
        return (
            f"Session #{self.pk} — {self.get_type_display()} "
            f"[{self.status.code}]"
        )


# ---------------------------------------------------------------------------
# AI Evaluation
# ---------------------------------------------------------------------------

class AIEvaluation(models.Model):
    """
    Stores the AI-generated evaluation for a completed interview session.
    Structured feedback is stored in JSONFields for flexible schema evolution
    without migrations.
    """

    interview = models.ForeignKey(
        InterviewSession,
        on_delete=models.CASCADE,
        related_name="evaluations",
        verbose_name="interview session",
    )
    score = models.PositiveSmallIntegerField(
        "score",
        help_text="Overall score assigned by the AI evaluator (0-100).",
    )
    strengths = models.JSONField(
        "strengths",
        default=list,
        help_text="List of identified strengths.",
    )
    weaknesses = models.JSONField(
        "weaknesses",
        default=list,
        help_text="List of identified weaknesses.",
    )
    improvements = models.JSONField(
        "improvements",
        default=list,
        help_text="Actionable improvement suggestions.",
    )
    raw_response = models.JSONField(
        "raw AI response",
        default=dict,
        help_text="Full unprocessed response from the AI provider for auditing.",
    )
    created_at = models.DateTimeField("created at", auto_now_add=True)

    class Meta:
        db_table = "interviews_ai_evaluation"
        ordering = ["-created_at"]
        verbose_name = "AI evaluation"
        verbose_name_plural = "AI evaluations"
        indexes = [
            models.Index(fields=["interview"], name="idx_eval_interview"),
        ]

    def __str__(self):
        return f"Evaluation for Session #{self.interview_id} — Score: {self.score}"
