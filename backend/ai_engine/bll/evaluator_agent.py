import json
from .interview_agent import get_groq_client

def generate_evaluation(session) -> dict:
    """
    Reads the session question, answer, chat_history, language, and difficulty.
    Calls Groq to evaluate the performance and returns a strict JSON dict:
    {
      "score": <int>,
      "strengths": [<str>],
      "weaknesses": [<str>],
      "improvements": [<str>]
    }
    """
    try:
        client = get_groq_client()
    except ValueError:
        # Fallback to mock if no API key
        return {
            "scores": {
                "problem_understanding": 80,
                "approach": 85,
                "code_quality": 90,
                "edge_cases": 75,
                "optimization": 80,
                "communication": 85
            },
            "final_score": 85,
            "strengths": ["Clear communication", "Mock mode activated successfully"],
            "weaknesses": ["No actual code logic was tested", "Missing Groq API Key"],
            "improvements": ["Set GROQ_API_KEY to receive real evaluations"],
            "verdict": "hire"
        }

    lang_str = f"Language: {session.language}" if session.language else ""
    diff_str = f"Level: {session.difficulty}" if session.difficulty else ""

    chat_transcript = ""
    if session.chat_history:
        for msg in session.chat_history:
            if msg['role'] != 'system':
                chat_transcript += f"{msg['role'].upper()}: {msg['content']}\n"

    system_prompt = (
        "You are an expert technical interviewer evaluating a candidate's performance. "
        "Review their final submitted answer and their chat discussion history with the AI interviewer.\n"
        "NOTE: The FINAL SUBMITTED ANSWER is a JSON-encoded array of files (e.g. [{'name': '...', 'content': '...'}]).\n"
        f"Question: {session.question}\n"
        f"Interview Type: {session.type}\n"
        f"{lang_str} {diff_str}\n\n"
        "EVALUATION RULES:\n"
        "- If this is a 'DSA' interview and NO valid solution is provided (or it is left empty), you MUST deduct points heavily from the score.\n"
        "- If the provided solution is WRONG, fails edge cases, or has syntax errors, you MUST deduct points accordingly.\n"
        "- You MUST ALWAYS explicitly state the Time and Space Complexity of their approach in your feedback (either as a strength or an improvement).\n\n"
        "You MUST respond with ONLY valid, raw JSON in exactly the following structure. No markdown formatting, no code blocks:\n"
        "{\n"
        "  \"scores\": {\n"
        "    \"problem_understanding\": 85,\n"
        "    \"approach\": 90,\n"
        "    \"code_quality\": 80,\n"
        "    \"edge_cases\": 70,\n"
        "    \"optimization\": 75,\n"
        "    \"communication\": 90\n"
        "  },\n"
        "  \"final_score\": 82,\n"
        "  \"strengths\": [\"Strength 1\", \"Strength 2\"],\n"
        "  \"weaknesses\": [\"Weakness 1\"],\n"
        "  \"improvements\": [\"Improvement 1\"],\n"
        "  \"verdict\": \"hire\"\n"
        "}"
    )

    user_prompt = (
        f"CHAT HISTORY:\n{chat_transcript}\n\n"
        f"FINAL SUBMITTED ANSWER:\n{session.answer}\n\n"
        "Please provide the evaluation JSON."
    )

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.2, # Low temp for deterministic JSON
            max_tokens=1024,
            response_format={"type": "json_object"}
        )
        raw_response = completion.choices[0].message.content
        return json.loads(raw_response)
    except Exception as e:
        print(f"Evaluator error: {e}")
        return {
            "scores": {
                "problem_understanding": 0,
                "approach": 0,
                "code_quality": 0,
                "edge_cases": 0,
                "optimization": 0,
                "communication": 0
            },
            "final_score": 0,
            "strengths": [],
            "weaknesses": ["Error running AI Evaluation"],
            "improvements": [str(e)],
            "verdict": "no_hire"
        }
