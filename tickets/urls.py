from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.CategoryListView.as_view()),
    path('tickets/', views.TicketListCreateView.as_view()),
    path('tickets/<int:pk>/', views.TicketDetailView.as_view()),
    path('tickets/<int:pk>/activity/', views.TicketActivityListView.as_view()),
    path('tickets/<int:pk>/comments/', views.TicketCommentListCreateView.as_view()),
    path('tickets/<int:pk>/timelogs/', views.TimeLogListCreateView.as_view()),
]
