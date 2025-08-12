from django.shortcuts import render

# Create your views here.
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import json
from agentic_app.agents.idea_agent import process_idea  
from agentic_app.agents.epic_agent import generate_epics_and_stories
from agentic_app.utils.db import get_project_data , get_all_developers
from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")
db = client["your_database"]
developers_collection = db["developers"]

@csrf_exempt
@require_POST
def process_idea_endpoint(request):
    """API endpoint to process a product idea."""
    try:
        # Parse JSON payload
        data = json.loads(request.body)
        project_id = data.get('project_id')
        idea = data.get('idea')
        team_metadata = data.get('team_metadata')

        if not project_id or not idea or not team_metadata:
            return JsonResponse({'error': 'Missing project_id, idea, or team_metadata'}, status=400)

        # Process idea with Agent 1
        analysis = process_idea(project_id, idea, team_metadata)
        return JsonResponse({'status': 'success', 'analysis': analysis}, status=200)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON payload'}, status=400)
    except ValueError as e:
        return JsonResponse({'error': str(e)}, status=500)
    except Exception as e:
        return JsonResponse({'error': f"Unexpected error: {str(e)}"}, status=500)
    
@csrf_exempt
@require_POST
def generate_epics_endpoint(request):
    """Generate epics and user stories from stored features."""
    try:
        data = json.loads(request.body)
        project_id = data.get('project_id')
        
        if not project_id:
            return JsonResponse({"error": "Missing project_id"}, status=400)
        
        # Retrieve Agent 1's output from MongoDB
        agent1_data = get_project_data(project_id)
        if not agent1_data or 'output' not in agent1_data:
            return JsonResponse({"error": "No Agent 1 output found for project_id"}, status=404)
        
        features = agent1_data['output'].get('features', [])
        epics_stories = generate_epics_and_stories(features, project_id)
        return JsonResponse({"status": "success", "epics_stories": epics_stories}, status=200)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON format"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
from django.http import JsonResponse
from agentic_app.agents.team_matcher_agent import match_team_and_allocate

def team_matcher_endpoint(request):
    """
    Run Agent 3: Match team members to stories.
    """
    try:
        project_id = request.GET.get("project_id")
        if not project_id:
            return JsonResponse({"error": "Missing project_id"}, status=400)
        
        # Run the team matcher
        allocations = match_team_and_allocate(project_id)
        
        return JsonResponse({
            "project_id": project_id,
            "allocations": allocations
        }, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


def get_developers_endpoint(request):
    """
    Retrieve all developers (for debugging or reference).
    """
    try:
        developers = get_all_developers()
        return JsonResponse({"developers": developers}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
