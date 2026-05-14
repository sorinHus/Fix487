from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),
    path('api/', include('tickets.urls')),
    path('api/', include('knowledge.urls')),
    path('api/', include('reports.urls')),
]