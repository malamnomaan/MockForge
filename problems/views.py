from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Level, Problem, UserProblemSubmission, UserLevelProgress
from .serializers import LevelSerializer, ProblemSerializer, ProblemListSerializer, UserLevelProgressSerializer, UserProblemSubmissionSerializer
from interviews.services.execute_service import execute_code
import json

class LevelListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LevelSerializer
    queryset = Level.objects.filter(is_active=True).order_by('level_number')

    def list(self, request, *args, **kwargs):
        progress, _ = UserLevelProgress.objects.get_or_create(user=request.user)
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        total_problems_solved = UserProblemSubmission.objects.filter(user=request.user, passed=True).values('problem_id').distinct().count()
        return Response({
            "success": True,
            "data": {
                "levels": serializer.data,
                "unlocked_level": progress.unlocked_level,
                "earned_badges": progress.earned_badges,
                "total_problems_solved": total_problems_solved
            }
        })

class ProblemListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ProblemListSerializer

    def get_queryset(self):
        level_num = self.kwargs.get('level_id')
        return Problem.objects.filter(level__level_number=level_num).order_by('id')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        # Also return the user's stars for each problem
        subs = UserProblemSubmission.objects.filter(user=request.user, problem__in=queryset).order_by('problem_id', '-stars')
        stars_map = {}
        for sub in subs:
            if sub.problem_id not in stars_map:
                stars_map[sub.problem_id] = sub.stars
        
        data = serializer.data
        for item in data:
            item['stars'] = stars_map.get(item['id'], 0)
            
        return Response({
            "success": True,
            "data": data
        })

class ProblemDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ProblemSerializer
    queryset = Problem.objects.all()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            "success": True,
            "data": serializer.data
        })

class SubmissionListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserProblemSubmissionSerializer

    def get_queryset(self):
        return UserProblemSubmission.objects.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "success": True,
            "data": serializer.data
        })

import json
import re

def _execute_with_tests(code, language, test_cases):
    if language == "python" and test_cases:
        # Enforce that the user must implement the solve function
        func_name = "solve"
        
        test_runner = "\n\n# --- Test Execution ---\nimport json\npassed=True\noutput_log=[]\n"
        for i, tc in enumerate(test_cases):
            inp = tc.get("input", "")
            exp = tc.get("expected_output", "")
            test_runner += f"""
try:
    res = {func_name}({inp})
    expected = {exp}
    if str(res) == str(expected) or res == expected:
        output_log.append('Test {i+1}: PASSED')
    else:
        output_log.append(f'Test {i+1}: FAILED. Expected {{expected}}, got {{res}}')
        passed=False
except Exception as e:
    output_log.append(f'Test {i+1}: ERROR - {{str(e)}}')
    passed=False
"""
        test_runner += "print('\\n'.join(output_log))\n"
        test_runner += "print('\\n---ALL_PASSED---' if passed else '\\n---FAILED---')\n"
        files = [{"name": "main.py", "content": code + test_runner}]
    else:
        files = [{"name": f"main.{language}", "content": code}]
        
    result = execute_code(language, files)
    
    passed = False
    if language == "python" and result['output'] and '---ALL_PASSED---' in result['output']:
        passed = True
    elif not result['error'] and language != "python":
        passed = True
        
    return passed, result

class RunProblemView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, problem_id):
        problem = get_object_or_404(Problem, id=problem_id)
        code = request.data.get('code')
        language = request.data.get('language')

        if not code or not language:
            return Response({"error": "code and language required"}, status=status.HTTP_400_BAD_REQUEST)

        # Run only the first 3 test cases
        test_cases_to_run = problem.test_cases[:3] if problem.test_cases else []
        passed, result = _execute_with_tests(code, language, test_cases_to_run)

        return Response({
            "success": True,
            "data": {
                "passed": passed,
                "output": result['output'],
                "error": result['error']
            }
        })

class SubmitProblemView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, problem_id):
        problem = get_object_or_404(Problem, id=problem_id)
        code = request.data.get('code')
        language = request.data.get('language')

        if not code or not language:
            return Response({"error": "code and language required"}, status=status.HTTP_400_BAD_REQUEST)

        # Run ALL test cases
        test_cases_to_run = problem.test_cases
        passed, result = _execute_with_tests(code, language, test_cases_to_run)

        stars = 5 if passed else 0

        sub = UserProblemSubmission.objects.create(
            user=request.user,
            problem=problem,
            code_submitted=code,
            language=language,
            stars=stars,
            passed=passed,
            execution_time_ms=150
        )

        return Response({
            "success": True,
            "data": {
                "passed": passed,
                "stars": stars,
                "output": result['output'],
                "error": result['error']
            }
        })
