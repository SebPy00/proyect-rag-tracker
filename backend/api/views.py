import requests
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from pgvector.django import L2Distance
from sentence_transformers import SentenceTransformer

from .models import Project, Column, Task, TaskEmbedding, ChatMessage 
from .serializers import ProjectSerializer, ColumnSerializer, TaskSerializer, MyTokenObtainPairSerializer, ChatMessageSerializer 

embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.projects.all()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        project = self.get_object()
        messages = project.chat_messages.filter(user=request.user)
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def ask(self, request, pk=None):
        project = self.get_object()
        question = request.data.get('question')

        if not question:
            return Response({'error': 'No se proporcionó ninguna pregunta.'}, status=400)
        
        ChatMessage.objects.create(
            project=project,
            user=request.user,
            sender='user',
            message=question
        )

        question_embedding = embedding_model.encode(question)

        similar_chunks = TaskEmbedding.objects.filter(
            task__column__project=project
        ).order_by(
            L2Distance('embedding', question_embedding)
        )[:3]

        if not similar_chunks:
            answer = 'Lo siento, no tengo suficiente información sobre este proyecto para responder.'
            prompt = "N/A"
        else:
            context = "Contexto de las tareas del proyecto:\n"
            for chunk in similar_chunks:
                context += f"- {chunk.text_chunk}\n"

            prompt = f"""
            Usando el siguiente contexto, responde la pregunta.
            Responde de forma concisa y amigable.

            {context}

            Pregunta: {question}
            Respuesta:
            """

            try:
                response = requests.post(
                    'http://ollama:11434/api/generate',
                    json={
                        'model': 'llama3',
                        'prompt': prompt,
                        'stream': False
                    },
                    timeout=60
                )
                response.raise_for_status()
                answer = response.json().get('response', 'No se recibió respuesta del modelo.')
            except requests.exceptions.RequestException as e:
                answer = f"Error al conectar con Ollama: {e}"

        ChatMessage.objects.create(
            project=project,
            user=request.user,
            sender='ai',
            message=answer
        )

        return Response({'answer': answer, 'prompt_used': prompt})


class ColumnViewSet(viewsets.ModelViewSet):
    queryset = Column.objects.all()
    serializer_class = ColumnSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Column.objects.filter(project__owner=self.request.user)

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(column__project__owner=self.request.user)

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer