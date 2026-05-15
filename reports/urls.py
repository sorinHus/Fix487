from django.urls import path
from . import views

urlpatterns = [
    path('reports/summary/', views.SummaryReportView.as_view()),
    path('reports/technicians/', views.TechnicianReportView.as_view()),
]
