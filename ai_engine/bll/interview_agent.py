import os
from groq import Groq
from django.conf import settings

def get_groq_client():
    # Attempt to get from settings, fallback to env var
    api_key = getattr(settings, 'GROQ_API_KEY', os.environ.get('GROQ_API_KEY'))
    if not api_key:
        raise ValueError("GROQ_API_KEY is not set in settings or environment.")
    return Groq(api_key=api_key)

def process_interview_chat(session, user_message: str) -> str:
    """
    Process a chat message for a specific interview session.
    Maintains context in session.chat_history.
    """
    try:
        client = get_groq_client()
    except ValueError as e:
        # Mock response if no API key is provided
        ai_response = f"[Mock Mode]: {str(e)} Please configure your Groq API key."
        
        # Still maintain state for testing
        if not session.chat_history:
            session.chat_history = [
                {"role": "system", "content": "mock system"},
                {"role": "assistant", "content": "Hello! I am your mock AI interviewer. Are you ready?"}
            ]
        session.chat_history.append({"role": "user", "content": user_message})
        session.chat_history.append({"role": "assistant", "content": ai_response})
        session.save(update_fields=['chat_history', 'updated_at'])
        return ai_response

    # Initialize history if empty
    if not session.chat_history:
        # Generate system prompt based on exam type
        lang_str = f" in {session.language}" if session.language else ""
        diff_str = f" Experience Level: {session.difficulty}." if session.difficulty else ""
        
        if session.type == 'DSA':
            system_prompt = (
                f"You are an expert FAANG interviewer conducting a Data Structures and Algorithms interview{lang_str}. "
                f"The candidate is solving the following problem:\n"
                f"{session.question}\n\n"
                f"{diff_str} "
                "CRITICAL INSTRUCTION: You MUST ask EXACTLY 2 DSA questions in total during this entire interview session. "
                "After the candidate successfully solves the first question, provide the 2nd question. "
                "CRITICAL: Do NOT give away the exact code or the full solution under ANY circumstances. "
                "Do not define or write the answer for them. Instead, evaluate their logic using short phrases like 'Almost there', 'Not quite', 'Correct', or 'Right path'. "
                "Ask guiding questions, point out edge cases, "
                "and encourage them to think about time and space complexity. Keep responses concise."
            )
        elif session.type == 'SYSTEM_DESIGN':
            system_prompt = (
                f"You are an expert FAANG system design interviewer. {diff_str} "
                "The candidate is designing:\n"
                f"{session.question}\n\n"
                "Ask probing questions about scale, bottlenecks, trade-offs (e.g., SQL vs NoSQL, consistency vs availability), "
                "and architecture. Keep responses concise."
            )
        else:
            system_prompt = (
                f"You are an expert technical interviewer conducting a rapid-fire QnA round{lang_str}. {diff_str} "
                "CRITICAL INSTRUCTION: You MUST ask EXACTLY 10 short technical questions in total during this entire interview session. "
                "Ask one short technical question at a time. Wait for the candidate to answer, evaluate the answer quickly, and then immediately ask the next question. "
                "CRITICAL: Do NOT give away the exact answer. If they are wrong, do not correct them with the exact definition. "
                "Just tell them if they are 'almost', 'not quite', 'correct', or 'right', and ask a guiding question or move on. "
                "Keep your questions focused strictly on the chosen language and difficulty level. "
                "Keep responses very concise."
            )
            
        session.chat_history = [
            {"role": "system", "content": system_prompt},
            {"role": "assistant", "content": f"Hello! Let's get started. Are you ready to begin your {session.get_type_display()} interview?"}
        ]
        
    # Append user message
    session.chat_history.append({"role": "user", "content": user_message})
    
    # Call Groq API
    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant", # Updated supported model
            messages=session.chat_history,
            temperature=0.7,
            max_tokens=500,
        )
        ai_response = completion.choices[0].message.content
    except Exception as e:
        ai_response = f"[AI Engine Error]: Unable to fetch response from Groq. Details: {str(e)}"
        
    # Append AI response
    session.chat_history.append({"role": "assistant", "content": ai_response})
    
    # Save session
    session.save(update_fields=['chat_history', 'updated_at'])
    
    return ai_response
