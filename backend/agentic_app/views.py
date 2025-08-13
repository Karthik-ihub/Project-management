from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET
from functools import wraps
import json
import jwt
import datetime
from agentic_app.agents.idea_agent import process_idea  
from agentic_app.agents.epic_agent import generate_epics_and_stories
from agentic_app.utils.db import get_mongo_client, get_project_data, get_all_developers
from pymongo import MongoClient
from bson import ObjectId
from django.contrib.auth.hashers import make_password, check_password
import re
from django.conf import settings

# JWT Configuration
SECRET_KEY = settings.SECRET_KEY
JWT_ALGORITHM = "HS256"

# Initialize MongoDB client using db.py
client = get_mongo_client()
db = client[settings.MONGO_DB_NAME]
developers_collection = db["developers"]
managers_collection = db["managers"]
project_analysis_collection = db["project_analysis"]

# JWT Token Verification Decorator
def jwt_required(f):
    @wraps(f)
    def decorated(request, *args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return JsonResponse({'error': 'Authorization header missing'}, status=401)
        
        try:
            token = auth_header.split(" ")[1] if len(auth_header.split(" ")) > 1 else None
            if not token:
                return JsonResponse({'error': 'Invalid token format'}, status=401)
            
            payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
            request.user_id = payload['user_id']
            request.user_type = payload['user_type']
        except jwt.ExpiredSignatureError:
            return JsonResponse({'error': 'Token has expired'}, status=401)
        except jwt.InvalidTokenError:
            return JsonResponse({'error': 'Invalid token'}, status=401)
        
        return f(request, *args, **kwargs)
    return decorated

# New endpoint to save edited analysis
@csrf_exempt
@jwt_required
@require_POST
def save_analysis(request):
    """API endpoint to save or update project analysis."""
    try:
        if request.user_type != 'manager':
            return JsonResponse({'error': 'Unauthorized: Not a manager'}, status=403)
        
        data = json.loads(request.body)
        project_id = data.get('project_id')
        analysis = data.get('analysis')

        if not project_id or not analysis:
            return JsonResponse({'error': 'Missing project_id or analysis'}, status=400)

        # Save or update the analysis
        project_analysis_collection.update_one(
            {'project_id': project_id},
            {'$set': {'analysis': analysis, 'updated_at': datetime.datetime.now()}},
            upsert=True
        )
        return JsonResponse({'status': 'success', 'message': 'Analysis saved successfully'}, status=200)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON payload'}, status=400)
    except Exception as e:
        return JsonResponse({'error': f"Unexpected error: {str(e)}"}, status=500)

# New endpoint to fetch all developers
@csrf_exempt
@jwt_required
@require_GET
def get_all_developers_endpoint(request):
    """API endpoint to retrieve all developers for team selection."""
    try:
        if request.user_type != 'manager':
            return JsonResponse({'error': 'Unauthorized: Not a manager'}, status=403)
        
        developers = list(developers_collection.find(
            {},
            {'_id': 1, 'name': 1, 'role': 1, 'skills': 1, 'bandwidth': 1, 'work_batch': 1}
        ))
        
        # Convert ObjectId to string for JSON response
        for developer in developers:
            developer['_id'] = str(developer['_id'])
        
        return JsonResponse({
            'status': 'success',
            'developers': developers
        }, status=200)
    
    except Exception as e:
        return JsonResponse({'error': f"Unexpected error: {str(e)}"}, status=500)

# Existing endpoints (unchanged)
@csrf_exempt
@require_POST
def process_idea_endpoint(request):
    """API endpoint to process a product idea."""
    try:
        data = json.loads(request.body)
        project_id = data.get('project_id')
        idea = data.get('idea')
        team_metadata = data.get('team_metadata')

        if not project_id or not idea or not team_metadata:
            return JsonResponse({'error': 'Missing project_id, idea, or team_metadata'}, status=400)

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

@csrf_exempt
@jwt_required
def team_matcher_endpoint(request):
    """Run Agent 3: Match team members to stories."""
    try:
        project_id = request.GET.get("project_id")
        if not project_id:
            return JsonResponse({"error": "Missing project_id"}, status=400)
        
        allocations = match_team_and_allocate(project_id)
        
        return JsonResponse({
            "project_id": project_id,
            "allocations": allocations
        }, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@jwt_required
def get_developers_endpoint(request):
    """Retrieve all developers (for debugging or reference)."""
    try:
        developers = get_all_developers()
        return JsonResponse({"developers": developers}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@require_POST
def developer_signup(request):
    """API endpoint for developer signup."""
    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')
        name = data.get('name')
        skills = data.get('skills', [])
        hours_per_day = data.get('hours_per_day')
        work_batch = data.get('work_batch')

        if not email or not password or not name or not hours_per_day or not work_batch:
            return JsonResponse({'error': 'Missing email, password, name, hours_per_day, or work_batch'}, status=400)
        
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return JsonResponse({'error': 'Invalid email format'}, status=400)
        
        if len(password) < 8 or not re.search(r"[0-9]", password) or not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            return JsonResponse({'error': 'Password must be at least 8 characters long and contain at least one number and one special character'}, status=400)
        
        if not isinstance(skills, list) or not all(isinstance(skill, str) for skill in skills):
            return JsonResponse({'error': 'Skills must be a list of strings'}, status=400)
        
        if hours_per_day not in [8, 9]:
            return JsonResponse({'error': 'Hours per day must be 8 or 9'}, status=400)
        
        if work_batch not in ['8-6', '9-5']:
            return JsonResponse({'error': 'Work batch must be either "8-6" or "9-5"'}, status=400)
        
        if developers_collection.find_one({'email': email}):
            return JsonResponse({'error': 'Email already registered'}, status=400)
        
        bandwidth = hours_per_day / 10.0
        
        hashed_password = make_password(password)
        developer_data = {
            'email': email,
            'password': hashed_password,
            'name': name,
            'role': 'Developer',
            'skills': skills,
            'task_allocated': False,
            'past_performance_score': 0.0,
            'bandwidth': bandwidth,
            'work_batch': work_batch,
            'created_at': datetime.datetime.now()
        }
        result = developers_collection.insert_one(developer_data)
        
        return JsonResponse({
            'status': 'success',
            'developer_id': str(result.inserted_id),
            'message': 'Developer registered successfully'
        }, status=201)
    
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON payload'}, status=400)
    except Exception as e:
        return JsonResponse({'error': f"Unexpected error: {str(e)}"}, status=500)

@csrf_exempt
@require_POST
def developer_login(request):
    """API endpoint for developer login with JWT."""
    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return JsonResponse({'error': 'Missing email or password'}, status=400)
        
        developer = developers_collection.find_one({'email': email})
        if not developer:
            return JsonResponse({'error': 'Invalid email or password'}, status=401)
        
        if not check_password(password, developer['password']):
            return JsonResponse({'error': 'Invalid email or password'}, status=401)
        
        token_payload = {
            'user_id': str(developer['_id']),
            'user_type': 'developer',
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24),
            'iat': datetime.datetime.utcnow()
        }
        token = jwt.encode(token_payload, SECRET_KEY, algorithm=JWT_ALGORITHM)
        
        return JsonResponse({
            'status': 'success',
            'developer_id': str(developer['_id']),
            'name': developer['name'],
            'token': token,
            'message': 'Login successful'
        }, status=200)
    
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON payload'}, status=400)
    except Exception as e:
        return JsonResponse({'error': f"Unexpected error: {str(e)}"}, status=500)

@csrf_exempt
@require_POST
def manager_signup(request):
    """API endpoint for manager signup."""
    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')
        name = data.get('name')
        department = data.get('department')

        if not email or not password or not name:
            return JsonResponse({'error': 'Missing email, password, or name'}, status=400)
        
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return JsonResponse({'error': 'Invalid email format'}, status=400)
        
        if len(password) < 8 or not re.search(r"[0-9]", password) or not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            return JsonResponse({'error': 'Password must be at least 8 characters long and contain at least one number and one special character'}, status=400)
        
        if managers_collection.find_one({'email': email}):
            return JsonResponse({'error': 'Email already registered'}, status=400)
        
        hashed_password = make_password(password)
        manager_data = {
            'email': email,
            'password': hashed_password,
            'name': name,
            'department': department or '',
            'created_at': datetime.datetime.now()
        }
        result = managers_collection.insert_one(manager_data)
        
        return JsonResponse({
            'status': 'success',
            'manager_id': str(result.inserted_id),
            'message': 'Manager registered successfully'
        }, status=201)
    
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON payload'}, status=400)
    except Exception as e:
        return JsonResponse({'error': f"Unexpected error: {str(e)}"}, status=500)

@csrf_exempt
@require_POST
def manager_login(request):
    """API endpoint for manager login with JWT."""
    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return JsonResponse({'error': 'Missing email or password'}, status=400)
        
        manager = managers_collection.find_one({'email': email})
        if not manager:
            return JsonResponse({'error': 'Invalid email or password'}, status=401)
        
        if not check_password(password, manager['password']):
            return JsonResponse({'error': 'Invalid email or password'}, status=401)
        
        token_payload = {
            'user_id': str(manager['_id']),
            'user_type': 'manager',
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24),
            'iat': datetime.datetime.utcnow()
        }
        token = jwt.encode(token_payload, SECRET_KEY, algorithm=JWT_ALGORITHM)
        
        return JsonResponse({
            'status': 'success',
            'manager_id': str(manager['_id']),
            'name': manager['name'],
            'token': token,
            'message': 'Login successful'
        }, status=200)
    
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON payload'}, status=400)
    except Exception as e:
        return JsonResponse({'error': f"Unexpected error: {str(e)}"}, status=500)

@csrf_exempt
@jwt_required
def get_managers_endpoint(request):
    """Retrieve all managers (for debugging or reference)."""
    try:
        managers = list(managers_collection.find({}, {'_id': 0, 'password': 0}))
        return JsonResponse({"managers": managers}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@jwt_required
@require_GET
def get_developer_profile(request):
    """API endpoint to retrieve developer profile."""
    try:
        if request.user_type != 'developer':
            return JsonResponse({'error': 'Unauthorized: Not a developer'}, status=403)
        
        developer = developers_collection.find_one(
            {'_id': ObjectId(request.user_id)},
            {'password': 0}
        )
        if not developer:
            return JsonResponse({'error': 'Developer not found'}, status=404)
        
        developer['_id'] = str(developer['_id'])
        return JsonResponse({
            'status': 'success',
            'profile': developer
        }, status=200)
    
    except ValueError:
        return JsonResponse({'error': 'Invalid user ID'}, status=400)
    except Exception as e:
        return JsonResponse({'error': f"Unexpected error: {str(e)}"}, status=500)

@csrf_exempt
@jwt_required
@require_POST
def update_developer_profile(request):
    """API endpoint to update developer profile."""
    try:
        if request.user_type != 'developer':
            return JsonResponse({'error': 'Unauthorized: Not a developer'}, status=403)
        
        data = json.loads(request.body)
        name = data.get('name')
        skills = data.get('skills')
        hours_per_day = data.get('hours_per_day')
        work_batch = data.get('work_batch')

        update_fields = {}
        if name:
            update_fields['name'] = name
        if skills:
            if not isinstance(skills, list) or not all(isinstance(skill, str) for skill in skills):
                return JsonResponse({'error': 'Skills must be a list of strings'}, status=400)
            update_fields['skills'] = skills
        if hours_per_day:
            if hours_per_day not in [8, 9]:
                return JsonResponse({'error': 'Hours per day must be 8 or 9'}, status=400)
            update_fields['hours_per_day'] = hours_per_day
            update_fields['bandwidth'] = hours_per_day / 10.0
        if work_batch:
            if work_batch not in ['8-6', '9-5']:
                return JsonResponse({'error': 'Work batch must be either "8-6" or "9-5"'}, status=400)
            update_fields['work_batch'] = work_batch

        if not update_fields:
            return JsonResponse({'error': 'No valid fields provided for update'}, status=400)
        
        result = developers_collection.update_one(
            {'_id': ObjectId(request.user_id)},
            {'$set': update_fields}
        )
        if result.matched_count == 0:
            return JsonResponse({'error': 'Developer not found'}, status=404)
        
        return JsonResponse({
            'status': 'success',
            'message': 'Profile updated successfully'
        }, status=200)
    
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON payload'}, status=400)
    except ValueError:
        return JsonResponse({'error': 'Invalid user ID'}, status=400)
    except Exception as e:
        return JsonResponse({'error': f"Unexpected error: {str(e)}"}, status=500)

@csrf_exempt
@jwt_required
@require_GET
def get_manager_profile(request):
    """API endpoint to retrieve manager profile."""
    try:
        if request.user_type != 'manager':
            return JsonResponse({'error': 'Unauthorized: Not a manager'}, status=403)
        
        manager = managers_collection.find_one(
            {'_id': ObjectId(request.user_id)},
            {'password': 0}
        )
        if not manager:
            return JsonResponse({'error': 'Manager not found'}, status=404)
        
        manager['_id'] = str(manager['_id'])
        return JsonResponse({
            'status': 'success',
            'profile': manager
        }, status=200)
    
    except ValueError:
        return JsonResponse({'error': 'Invalid user ID'}, status=400)
    except Exception as e:
        return JsonResponse({'error': f"Unexpected error: {str(e)}"}, status=500)

@csrf_exempt
@jwt_required
@require_POST
def update_manager_profile(request):
    """API endpoint to update manager profile."""
    try:
        if request.user_type != 'manager':
            return JsonResponse({'error': 'Unauthorized: Not a manager'}, status=403)
        
        data = json.loads(request.body)
        name = data.get('name')
        department = data.get('department')

        update_fields = {}
        if name:
            update_fields['name'] = name
        if department:
            update_fields['department'] = department

        if not update_fields:
            return JsonResponse({'error': 'No valid fields provided for update'}, status=400)
        
        result = managers_collection.update_one(
            {'_id': ObjectId(request.user_id)},
            {'$set': update_fields}
        )
        if result.matched_count == 0:
            return JsonResponse({'error': 'Manager not found'}, status=404)
        
        return JsonResponse({
            'status': 'success',
            'message': 'Profile updated successfully'
        }, status=200)
    
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON payload'}, status=400)
    except ValueError:
        return JsonResponse({'error': 'Invalid user ID'}, status=400)
    except Exception as e:
        return JsonResponse({'error': f"Unexpected error: {str(e)}"}, status=500)