from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Project, Column, Task, ChatMessage


class TaskSerializer(serializers.ModelSerializer):
    def validate_column(self, value):
        if value.project.owner_id != self.context["request"].user.pk:
            raise serializers.ValidationError("Columna no disponible.")
        if self.instance and value.project_id != self.instance.column.project_id:
            raise serializers.ValidationError("No puedes mover tareas entre proyectos.")
        return value

    class Meta:
        model = Task
        fields = ["id", "column", "title", "description", "order"]


class ColumnSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)

    def validate_project(self, value):
        if value.owner_id != self.context["request"].user.pk:
            raise serializers.ValidationError("Proyecto no disponible.")
        if self.instance and value.pk != self.instance.project_id:
            raise serializers.ValidationError(
                "No puedes mover columnas entre proyectos."
            )
        return value

    class Meta:
        model = Column
        fields = ["id", "project", "title", "order", "tasks"]


class ProjectSerializer(serializers.ModelSerializer):
    columns = ColumnSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = ["id", "name", "description", "created_at", "columns"]


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token["username"] = user.username

        return token


class ChatMessageSerializer(serializers.ModelSerializer):
    text = serializers.CharField(source="message")

    class Meta:
        model = ChatMessage
        fields = ["sender", "text", "created_at"]
