from django.urls import path
from . import views

urlpatterns = [
    path('kb/categories/', views.KBCategoryListView.as_view()),
    path('kb/articles/', views.KBArticleListCreateView.as_view()),
    path('kb/articles/<int:pk>/', views.KBArticleDetailView.as_view()),
]
