from django.urls import path
from . import views

urlpatterns = [
    path('posts/', views.get_posts, name='community_posts'),
    path('posts/<int:post_id>/', views.get_post_detail, name='post_detail'),
    path('posts/create/', views.create_post, name='create_post'),
    path('posts/<int:post_id>/comments/', views.create_comment, name='create_comment'),
    path('like/', views.toggle_like, name='toggle_like'),
]
