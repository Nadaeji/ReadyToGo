from django.urls import path
from . import views

urlpatterns = [
    path('', views.get_checklists, name='checklists'),
    path('<int:checklist_id>/', views.get_checklist_detail, name='checklist_detail'),
]
