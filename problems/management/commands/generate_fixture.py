import json
import os
import time
from django.core.management.base import BaseCommand
from groq import Groq
from django.conf import settings

TITLES = [
    "Two Sum", "Reverse String", "Valid Palindrome", "Contains Duplicate", "Single Number",
    "Plus One", "Move Zeroes", "Valid Anagram", "Majority Element", "Missing Number",
    "Intersection of Two Arrays", "First Unique Character", "Fizz Buzz", "Power of Two", "Reverse Integer",
    "Roman to Integer", "Longest Common Prefix", "Valid Parentheses", "Merge Two Sorted Lists", "Remove Duplicates from Sorted Array",
    "Remove Element", "Find the Index of the First Occurrence", "Search Insert Position", "Length of Last Word", "Add Binary",
    "Climbing Stairs", "Merge Sorted Array", "Binary Tree Inorder Traversal", "Same Tree", "Symmetric Tree",
    "Maximum Depth of Binary Tree", "Convert Sorted Array to Binary Search Tree", "Balanced Binary Tree", "Minimum Depth of Binary Tree", "Path Sum",
    "Pascal's Triangle", "Best Time to Buy and Sell Stock", "Valid Palindrome II", "Excel Sheet Column Title", "Excel Sheet Column Number",
    "Number of 1 Bits", "Reverse Bits", "Happy Number", "Isomorphic Strings", "Contains Duplicate II",
    "Summary Ranges", "Power of Three", "Counting Bits", "Find the Difference", "Is Subsequence"
]

class Command(BaseCommand):
    help = 'Generates a JSON fixture of 50 Level 1 problems using Groq'

    def handle(self, *args, **options):
        client = Groq(api_key=settings.GROQ_API_KEY)
        fixture_data = [
            {
                "model": "problems.level",
                "pk": 1,
                "fields": {
                    "level_number": 1,
                    "title": "Level 1: Arrays & Strings Basics",
                    "description": "Fundamental programming constructs and linear data structures.",
                    "is_active": True
                }
            }
        ]

        batch_size = 5
        pk_counter = 1

        self.stdout.write("Generating 50 problems...")
        
        for i in range(0, len(TITLES), batch_size):
            batch_titles = TITLES[i:i+batch_size]
            self.stdout.write(f"Processing batch {i//batch_size + 1}: {batch_titles}")
            
            prompt = (
                "You are an expert curriculum designer. For the following 5 Data Structure and Algorithm problems, "
                "provide a detailed description, starter code in python, java, and javascript, and 3 test cases (input and expected_output as strings). "
                f"Problems: {', '.join(batch_titles)}\n"
                "Return the response ONLY as a JSON array of objects with this EXACT structure:\n"
                "[\n"
                "  {\n"
                "    \"title\": \"Problem Title\",\n"
                "    \"description\": \"Markdown description...\",\n"
                "    \"difficulty\": \"Easy\",\n"
                "    \"starter_code\": {\"python\": \"def solve(nums):\\n    pass\", \"javascript\": \"function solve(nums) {\\n}\"},\n"
                "    \"test_cases\": [{\"input\": \"[2,7,11,15], 9\", \"expected_output\": \"[0, 1]\"}]\n"
                "  }\n"
                "]"
            )

            try:
                completion = client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                    max_tokens=4000,
                    response_format={"type": "json_object"}
                )
                
                res = json.loads(completion.choices[0].message.content)
                problems_list = res.get("problems", []) if isinstance(res, dict) and "problems" in res else res
                if isinstance(problems_list, dict):
                    problems_list = list(problems_list.values())[0]

                for prob in problems_list:
                    fixture_data.append({
                        "model": "problems.problem",
                        "pk": pk_counter,
                        "fields": {
                            "level": 1,
                            "title": prob.get("title", "Unknown"),
                            "description": prob.get("description", ""),
                            "difficulty": prob.get("difficulty", "Easy"),
                            "starter_code": prob.get("starter_code", {}),
                            "test_cases": prob.get("test_cases", []),
                            "created_at": "2024-01-01T00:00:00Z"
                        }
                    })
                    pk_counter += 1
                    
                time.sleep(2) # rate limiting
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error on batch: {e}"))
                
        # Save to fixture
        fixture_dir = os.path.join(settings.BASE_DIR, "problems", "fixtures")
        os.makedirs(fixture_dir, exist_ok=True)
        fixture_path = os.path.join(fixture_dir, "level1.json")
        
        with open(fixture_path, 'w') as f:
            json.dump(fixture_data, f, indent=4)
            
        self.stdout.write(self.style.SUCCESS(f"Successfully generated {pk_counter-1} problems into {fixture_path}"))
