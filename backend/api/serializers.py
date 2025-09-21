from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import Project, Column, Task, ChatMessage

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['id', 'column', 'title', 'description', 'order']

class ColumnSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)

    class Meta:
        model = Column
        fields = ['id', 'project', 'title', 'order', 'tasks']

class ProjectSerializer(serializers.ModelSerializer):
    columns = ColumnSerializer(many=True, read_only=True)
    
    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'created_at', 'columns']

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token['username'] = user.username

        return token
    
class ChatMessageSerializer(serializers.ModelSerializer):
    text = serializers.CharField(source='message')

    class Meta:
        model = ChatMessage
        fields = ['sender', 'text', 'created_at']