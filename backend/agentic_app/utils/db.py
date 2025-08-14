import os
import sys
from django.conf import settings
import django
from pymongo import MongoClient
from datetime import datetime

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

def get_mongo_client():
    """Initialize MongoDB client."""
    try:
        client = MongoClient(settings.MONGO_URI)
        return client
    except Exception as e:
        raise ValueError(f"Failed to connect to MongoDB: {e}")

def get_project_data(project_id):
    """Retrieve project data from MongoDB."""
    try:
        client = get_mongo_client()
        db = client[settings.MONGO_DB_NAME]
        collection = db['project_analysis']  # Updated collection name
        data = collection.find_one({"project_id": project_id})
        client.close()
        return data
    except Exception as e:
        raise ValueError(f"Failed to retrieve project data: {e}")

def save_agent_output(project_id, agent_name, output):
    """Save agent output to MongoDB."""
    try:
        client = get_mongo_client()
        db = client[settings.MONGO_DB_NAME]
        collection = db['agent_outputs']
        document = {
            "project_id": project_id,
            "agent_name": agent_name,
            "output": output,
            "timestamp": datetime.now()
        }
        result = collection.insert_one(document)
        client.close()
        return result.inserted_id
    except Exception as e:
        raise ValueError(f"Failed to save agent output: {e}")
def get_all_developers():
    """Retrieve all developers from MongoDB."""
    try:
        client = get_mongo_client()
        db = client[settings.MONGO_DB_NAME]
        collection = db['developers']
        data = list(collection.find({}, {"_id": 0}))  # exclude _id for clean JSON
        client.close()
        return data
    except Exception as e:
        raise ValueError(f"Failed to retrieve developers: {e}")
def get_user_stories(project_id):
    client = get_mongo_client()
    db = client[settings.MONGO_DB_NAME]
    collection = db['project_epics_stories']
    doc = collection.find_one({"project_id": project_id})
    client.close()
    if not doc or "epics_stories" not in doc:
        raise ValueError(f"No epics_stories found for project_id {project_id}")
    # Adapt to the expected format
    return {
        "output": {
            "user_stories": doc["epics_stories"].get("user_stories", [])
        }
    }

