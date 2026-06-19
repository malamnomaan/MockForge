from django.db import models
from django.conf import settings

class Level(models.Model):
    level_number = models.PositiveSmallIntegerField(unique=True)
    title = models.CharField(max_length=200)
    description = models.TextField()
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['level_number']

    def __str__(self):
        return f"Level {self.level_number}: {self.title}"

class Problem(models.Model):
    DIFFICULTY_CHOICES = (
        ('Easy', 'Easy'),
        ('Medium', 'Medium'),
        ('Hard', 'Hard'),
    )
    level = models.ForeignKey(Level, on_delete=models.CASCADE, related_name="problems")
    title = models.CharField(max_length=255)
    description = models.TextField(help_text="Markdown description of the problem")
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='Easy')
    starter_code = models.JSONField(default=dict, help_text="Dictionary mapping language to starter code")
    test_cases = models.JSONField(default=list, help_text="List of dicts: [{'input': '...', 'expected_output': '...'}]")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['level', 'id']

    def __str__(self):
        return f"{self.title} (Level {self.level.level_number})"

class UserProblemSubmission(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="problem_submissions")
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE, related_name="submissions")
    code_submitted = models.TextField()
    language = models.CharField(max_length=50)
    stars = models.PositiveSmallIntegerField(default=0, help_text="0 to 5 stars")
    passed = models.BooleanField(default=False)
    execution_time_ms = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

class UserLevelProgress(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="level_progress")
    unlocked_level = models.PositiveSmallIntegerField(default=1)
    earned_badges = models.JSONField(default=list)

    def __str__(self):
        return f"Progress for {self.user} - Level {self.unlocked_level}"
