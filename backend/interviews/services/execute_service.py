import os
import tempfile
import subprocess

def execute_code(language: str, files: list) -> dict:
    """
    Securely execute code in a temporary directory.
    Uses subprocess with a 5-second timeout to prevent infinite loops.
    """
    with tempfile.TemporaryDirectory() as temp_dir:
        # Write files to disk
        for f in files:
            file_path = os.path.join(temp_dir, f.get("name", "main.txt"))
            with open(file_path, "w", encoding="utf-8") as out:
                out.write(f.get("content", ""))
                
        # Determine execution command
        lang = language.lower()
        cmd = []
        is_shell = False
        
        if lang == "python":
            main_file = next((f["name"] for f in files if f["name"].endswith(".py")), "main.py")
            cmd = ["python", main_file]
        elif lang in ["javascript", "js", "typescript", "ts"]:
            main_file = next((f["name"] for f in files if f["name"].endswith(".js") or f["name"].endswith(".ts")), "main.js")
            cmd = ["node", main_file]
        elif lang == "java":
            main_file = next((f["name"] for f in files if f["name"].endswith(".java")), "Solution.java")
            main_class = main_file.replace(".java", "")
            cmd = f"javac *.java && java {main_class}"
            is_shell = True
        elif lang in ["c++", "cpp"]:
            cmd = "g++ *.cpp -o a.out && ./a.out"
            is_shell = True
        elif lang == "go":
            cmd = "go run ."
            is_shell = True
        else:
            return {"output": f"Execution for language '{language}' is not supported locally.", "error": True}

        try:
            if is_shell:
                result = subprocess.run(cmd, shell=True, cwd=temp_dir, capture_output=True, text=True, timeout=5)
            else:
                result = subprocess.run(cmd, cwd=temp_dir, capture_output=True, text=True, timeout=5)
                
            output = result.stdout + result.stderr
            return {"output": output.strip() or "Success (No Output)", "error": result.returncode != 0}
            
        except subprocess.TimeoutExpired:
            return {"output": "Error: Execution Timed Out (5 seconds limit exceeded).", "error": True}
        except Exception as e:
            return {"output": f"Execution Failed: {str(e)}\n\n(Note: Ensure compilers like node/java/g++ are installed on the host machine)", "error": True}
