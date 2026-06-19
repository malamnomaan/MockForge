import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from django.core.management.base import BaseCommand
from groq import Groq
from django.conf import settings
from problems.models import Problem

class Command(BaseCommand):
    help = 'Uses Groq API to fill in real descriptions, starter code, and test cases for all problems'

    def process_problem(self, client, problem):
        prompt = (
            f"You are an expert curriculum designer. Provide the details for the LeetCode-style problem: **{problem.title}**.\n"
            "Return ONLY a JSON object with this EXACT structure (no markdown blocks, no extra text):\n"
            "{\n"
            f"  \"title\": \"{problem.title}\",\n"
            "  \"description\": \"A detailed markdown description of the problem, including examples and constraints.\",\n"
            "  \"starter_code\": {\n"
            "    \"python\": \"def solve(nums):\\n    pass\",\n"
            "    \"javascript\": \"function solve(nums) {\\n}\"\n"
            "  },\n"
            "  \"test_cases\": [\n"
            "    {\"input\": \"[2,7,11,15], 9\", \"expected_output\": \"[0, 1]\"},\n"
            "    {\"input\": \"[3,2,4], 6\", \"expected_output\": \"[1, 2]\"}\n"
            "  ]\n"
            "}"
        )
        
        try:
            completion = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=1500,
                response_format={"type": "json_object"}
            )
            res = json.loads(completion.choices[0].message.content)
            
            problem.description = res.get("description", problem.description)
            problem.starter_code = res.get("starter_code", problem.starter_code)
            problem.test_cases = res.get("test_cases", problem.test_cases)
            problem.save()
            return f"Success: {problem.title}"
        except Exception as e:
            return f"Failed: {problem.title} - {str(e)}"

    def handle(self, *args, **kwargs):
        client = Groq(api_key=settings.GROQ_API_KEY)
        # Only process problems that still have the dummy "Return the input directly" text
        problems = list(Problem.objects.filter(level__level_number=1, description__contains="Return the input directly"))
        
        self.stdout.write(f"Starting to fill details for {len(problems)} remaining problems using Groq sequentially to respect rate limits...")
        
        for p in problems:
            self.stdout.write(f"Processing {p.title}...")
            res = self.process_problem(client, p)
            self.stdout.write(res)
            time.sleep(12) # 5 requests per minute avg to respect 6000 TPM limit
            
        self.stdout.write(self.style.SUCCESS("Finished updating all problems!"))
