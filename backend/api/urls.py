from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ProjectViewSet, ColumnViewSet, TaskViewSet 
from users.views import UserViewSet

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'columns', ColumnViewSet, basename='column')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
]