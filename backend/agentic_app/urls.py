from django.urls import path
from agentic_app import views

urlpatterns = [
    path('submit-idea/', views.process_idea_endpoint, name='process_idea'),
    path('epics/', views.generate_epics_endpoint, name='generate_epics'),
    path("team-matcher/", views.team_matcher_endpoint, name="team_matcher_endpoint"),
    path("developers/", views.get_developers_endpoint, name="get_developers_endpoint"),
    path("developer/signup/", views.developer_signup, name="developer_signup"),
    path("developer/login/", views.developer_login, name="developer_login"),
    path("manager/signup/", views.manager_signup, name="manager_signup"),
    path("manager/login/", views.manager_login, name="manager_login"),
    path("managers/", views.get_managers_endpoint, name="get_managers_endpoint"),
    path("save-analysis/", views.save_analysis, name="save_analysis"),
]