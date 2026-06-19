from rest_framework import serializers
from .models import Level, Problem, UserProblemSubmission, UserLevelProgress

class LevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Level
        fields = ['id', 'level_number', 'title', 'description', 'is_active']

class ProblemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Problem
        fields = ['id', 'level', 'title', 'description', 'difficulty', 'starter_code', 'test_cases']

class ProblemListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Problem
        fields = ['id', 'level', 'title', 'difficulty']

class UserProblemSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProblemSubmission
        fields = ['id', 'problem', 'code_submitted', 'language', 'stars', 'passed', 'execution_time_ms', 'created_at']

class UserLevelProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserLevelProgress
        fields = ['unlocked_level', 'earned_badges']
