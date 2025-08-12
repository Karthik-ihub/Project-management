import os
import pickle
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from django.conf import settings
import datetime

def get_calendar_service():
    """Initialize and return Google Calendar API service."""
    SCOPES = ['https://www.googleapis.com/auth/calendar']
    creds = None
    token_path = os.path.join(settings.BASE_DIR, 'token.pickle')

    if os.path.exists(token_path):
        with open(token_path, 'rb') as token:
            creds = pickle.load(token)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                settings.GOOGLE_CREDENTIALS_PATH, SCOPES)
            creds = flow.run_local_server(port=0)
            with open(token_path, 'wb') as token:
                pickle.dump(creds, token)
    
    try:
        service = build('calendar', 'v3', credentials=creds)
        return service
    except Exception as e:
        raise ValueError(f"Failed to initialize Calendar API: {e}")

def create_sprint_event(project_id, sprint_name, start_date, end_date, attendees=None):
    """Create a sprint event in Google Calendar."""
    try:
        service = get_calendar_service()
        event = {
            'summary': f'Sprint: {sprint_name} ({project_id})',
            'description': f'Sprint planning for project {project_id}.',
            'start': {
                'dateTime': start_date.isoformat(),
                'timeZone': 'UTC',
            },
            'end': {
                'dateTime': end_date.isoformat(),
                'timeZone': 'UTC',
            },
        }
        if attendees:
            event['attendees'] = [{'email': email} for email in attendees]
        
        calendar_id = 'primary'
        created_event = service.events().insert(calendarId=calendar_id, body=event).execute()
        return created_event['id']
    except Exception as e:
        raise ValueError(f"Failed to create sprint event: {e}")