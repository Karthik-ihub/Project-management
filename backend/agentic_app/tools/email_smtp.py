import smtplib
from email.mime.text import MIMEText
from django.conf import settings

def send_email(subject, body, to_email):
    """Send an email using SMTP."""
    try:
        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = settings.EMAIL_HOST_USER
        msg['To'] = to_email

        with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT) as server:
            server.starttls()
            server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        raise ValueError(f"Failed to send email: {e}")

def send_stakeholder_notification(project_id, message, to_email):
    """Send a notification to stakeholders."""
    subject = f"Project Update: {project_id}"
    body = f"Project {project_id} Update:\n\n{message}"
    return send_email(subject, body, to_email)