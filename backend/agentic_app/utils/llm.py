import os
import sys
import json
import re
from django.conf import settings
import django
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

# Ensure the backend directory is in the Python path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

# Configure Django settings for standalone script
if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
    try:
        django.setup()
    except Exception as e:
        print(f"Failed to configure Django settings: {e}")
        sys.exit(1)

def initialize_gemini(model_name="gemini-1.5-flash"):
    """Initialize LangChain Google Generative AI model."""
    try:
        llm = ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.5
        )
        return llm
    except Exception as e:
        raise ValueError(f"Failed to initialize Gemini LLM: {e}")

def generate_idea_analysis(idea, team_metadata, rag_context=None, model=None):
    """Generate concise structured analysis for a product idea."""
    try:
        if model is None:
            model = initialize_gemini()
        
        # Construct concise prompt with strict schema
        context = rag_context if rag_context else "Use Agile methodology best practices."
        prompt = f"""
You are an AI assistant analyzing a product idea for Agile development.
Given the idea and team metadata, provide a concise JSON output with ONLY:
- domain: The product’s industry (e.g., Social Media).
- features: Exactly 3 key features, each with a name and short description (20 words max).
- personas: Exactly 2 user personas, each with a role and needs (20 words max).
- modules: 2-3 technical modules required (e.g., Frontend, Backend).
- risks: Exactly 2 risks with mitigations (20 words max each).
Use this Agile context: {context}
Output valid JSON, no extra fields. Assume reasonably if idea is vague, note in risks.

Idea: {idea}
Team Metadata: {json.dumps(team_metadata, indent=2)}

Output in JSON format:
```json
{{
  "domain": "",
  "features": [{{"name": "", "description": ""}}, ...],
  "personas": [{{"role": "", "needs": ""}}, ...],
  "modules": [""],
  "risks": [{{"risk": "", "mitigation": ""}}, ...]
}}
```
"""
        
        # Create prompt template
        prompt_template = ChatPromptTemplate.from_messages([
            ("human", "{prompt}")
        ])
        
        # Format and invoke
        chain = prompt_template | model
        response = chain.invoke({"prompt": prompt})
        
        # Strip ```json and ``` markers
        content = response.content
        content = re.sub(r'^```json\n|\n```$', '', content, flags=re.MULTILINE).strip()
        
        # Parse JSON response
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            raise ValueError(f"Failed to parse LLM output as JSON: {content}")
    except Exception as e:
        raise ValueError(f"Failed to generate idea analysis: {str(e)}")