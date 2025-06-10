from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
    path('api/chat/', include('chat.urls')),
    path('api/documents/', include('documents.urls')),
    path('api/realtime/', include('realtime_info.urls')),
    path('api/checklist/', include('checklist.urls')),
    path('api/community/', include('community.urls')),
]
