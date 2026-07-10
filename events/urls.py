# events/urls.py
from django.urls import path
from .views import EventListCreateView, EventDetailView, CategoryListCreateView, AdminAnalyticsView

urlpatterns = [
    path('categories/', CategoryListCreateView.as_view(), name='category-list'),
    path('events/', EventListCreateView.as_view(), name='event-list'),
    path('events/<int:pk>/', EventDetailView.as_view(), name='event-detail'),
    path('admin/analytics/', AdminAnalyticsView.as_view(), name='admin-analytics'), # Added pipeline
]