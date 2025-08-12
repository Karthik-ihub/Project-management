from django.urls import path
from agentic_app import views

urlpatterns = [
    path('submit-idea/', views.process_idea_endpoint, name='process_idea'),
    path('epics/', views.generate_epics_endpoint, name='generate_epics'),
    path("team-matcher/", views.team_matcher_endpoint, name="team_matcher_endpoint"),
    path("developers/", views.get_developers_endpoint, name="get_developers_endpoint"),
]