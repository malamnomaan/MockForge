from django.core.management.base import BaseCommand
from problems.models import Level, Problem

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
    def handle(self, *args, **kwargs):
        level, _ = Level.objects.get_or_create(level_number=1, title="Level 1: Arrays & Strings Basics", description="Fundamental programming constructs and linear data structures.")
        
        for i, title in enumerate(TITLES):
            Problem.objects.get_or_create(
                level=level,
                title=title,
                defaults={
                    "description": f"Solve **{title}**. Return the input directly.",
                    "difficulty": "Easy",
                    "starter_code": {"python": "def solve(x):\n    return x", "javascript": "function solve(x) {\n    return x;\n}"},
                    "test_cases": [{"input": "1", "expected_output": "1"}, {"input": "2", "expected_output": "2"}]
                }
            )
            
        self.stdout.write("Seeded 50 static problems instantly.")
