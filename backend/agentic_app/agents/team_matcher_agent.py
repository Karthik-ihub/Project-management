import os
import sys
import json
from django.conf import settings
# Updated import
from agentic_app.utils.db import get_user_stories, get_mongo_client, save_agent_output
from agentic_app.utils.llm import initialize_gemini

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)


def fetch_available_developers():
    """Fetch developers who are free (task_allocated=False) from MongoDB."""
    client = get_mongo_client()
    db = client[settings.MONGO_DB_NAME]
    collection = db["developers"]
    devs = list(collection.find({"task_allocated": False}, {"_id": 0}))
    client.close()
    return devs


def update_developer_allocation(developer_names):
    """Mark developers as allocated in MongoDB."""
    client = get_mongo_client()
    db = client[settings.MONGO_DB_NAME]
    collection = db["developers"]
    collection.update_many(
        {"name": {"$in": developer_names}},
        {"$set": {"task_allocated": True}}
    )
    client.close()


def match_team_and_allocate(project_id):
    """Allocate stories to developers based on skills, bandwidth, and performance."""
    try:
        # 1. Get user stories from the new collection
        client = get_mongo_client()
        db = client[settings.MONGO_DB_NAME]
        collection = db['project_epics_stories']
        epics_stories_doc = collection.find_one({"project_id": project_id})
        client.close()
        
        if not epics_stories_doc:
            raise ValueError(f"No epics and stories found for project_id {project_id}")
        
        epics_stories = epics_stories_doc.get("epics_stories", {})
        stories = epics_stories.get("user_stories", [])
        if not stories:
            raise ValueError("No user stories found for allocation")

        # 2. Get available developers
        developers = fetch_available_developers()
        if not developers:
            raise ValueError("No available developers for allocation")

        # 3. Prepare AI prompt
        model = initialize_gemini()
        prompt = f"""
You are an AI allocation assistant. 
Given the list of user stories and developer profiles, allocate each story to the best-suited developer.
Criteria:
- Match skills in story with developer skills.
- Prefer developers with higher past_performance_score.
- Only assign developers who are available.
- Ensure fair distribution based on bandwidth.

Output ONLY in this JSON format:
{{
  "allocations": [
    {{
      "story_title": "",
      "assigned_to": "",
      "reason": ""
    }}
  ]
}}

User Stories:
{json.dumps(stories, indent=2)}

Developers:
{json.dumps(developers, indent=2)}
"""

        response = model.invoke(prompt)
        content = response.content.strip()

        # FIX: Clean potential markdown formatting from the LLM response
        if content.startswith("```json"):
            content = content[len("```json"):].strip()
        if content.endswith("```"):
            content = content[:-len("```")].strip()

        # 4. Parse JSON
        try:
            allocations = json.loads(content)
        except json.JSONDecodeError:
            raise ValueError(f"Failed to parse LLM output as JSON: {content}")

        # 5. Save output in MongoDB
        save_agent_output(project_id, "team_matcher_agent", allocations)

        # 6. Update developer allocation status
        assigned_names = [a["assigned_to"] for a in allocations.get("allocations", [])]
        update_developer_allocation(assigned_names)

        return allocations

    except Exception as e:
        raise ValueError(f"Failed in Team Matcher Agent: {e}")