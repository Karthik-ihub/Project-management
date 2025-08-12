import os
import sys
import json
from django.conf import settings
from agentic_app.utils.db import save_agent_output
from agentic_app.utils.llm import initialize_gemini

# Ensure the backend directory is in the Python path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

def generate_epics_and_stories(features, project_id):
    """Generate epics and user stories from features in Gherkin/SMART format."""
    try:
        model = initialize_gemini()
        prompt = f"""
You are an AI assistant generating epics and user stories for Agile development.
Given the features below, provide a JSON output with:
- epics: A list of 1-2 epics, each with a name and description (20 words max).
- user_stories: A list of 2-3 user stories in Gherkin format (Given-When-Then, SMART).
Output only these fields in valid JSON.

Features: {json.dumps(features, indent=2)}

Output in JSON format:
```json
{{
  "epics": [{{"name": "", "description": ""}}, ...],
  "user_stories": [{{"title": "", "gherkin": ""}}, ...]
}}
```
"""
        from langchain_core.prompts import ChatPromptTemplate
        prompt_template = ChatPromptTemplate.from_messages([("human", "{prompt}")])
        chain = prompt_template | model
        response = chain.invoke({"prompt": prompt})
        
        # Strip ```json markers
        import re
        content = re.sub(r'^```json\n|\n```$', '', response.content, flags=re.MULTILINE).strip()
        
        # Parse JSON
        try:
            output = json.loads(content)
        except json.JSONDecodeError:
            raise ValueError(f"Failed to parse LLM output as JSON: {content}")
        
        # Save to MongoDB
        save_agent_output(project_id, "epic_agent", output)
        return output
    except Exception as e:
        raise ValueError(f"Failed to generate epics and stories: {e}")