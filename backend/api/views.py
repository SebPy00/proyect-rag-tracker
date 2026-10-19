import requests
from django.conf import settings
from django.db import connection, transaction
from rest_framework import viewsets, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from pgvector.django import L2Distance
from .ai import capabilities, embed
from .models import Project, Column, Task, TaskEmbedding, ChatMessage
from .serializers import (
    ProjectSerializer,
    ColumnSerializer,
    TaskSerializer,
    MyTokenObtainPairSerializer,
    ChatMessageSerializer,
)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def health(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
    except Exception:
        return Response({"status": "unavailable"}, status=503)
    return Response({"status": "ok"})


@api_view(["GET"])
def capability_view(request):
    return Response(capabilities())


@api_view(["GET"])
def me(request):
    user = request.user
    return Response(
        {
            "id": user.pk,
            "username": user.username,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
        }
    )


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.projects.prefetch_related("columns__tasks").all()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=["post"])
    def reorder(self, request, pk=None):
        # Serialize reorders for a project; reject stale/incomplete layouts atomically.
        with transaction.atomic():
            project = (
                self.get_queryset().select_for_update().get(pk=self.get_object().pk)
            )
            columns = {str(c.pk): c for c in Column.objects.filter(project=project)}
            tasks = {str(t.pk): t for t in Task.objects.filter(column__project=project)}
            layout = request.data.get("columns")
            if not isinstance(layout, list) or any(
                not isinstance(c, dict) for c in layout
            ):
                return Response({"detail": "Formato de tablero inválido."}, status=400)
            column_ids = [c.get("id") for c in layout]
            task_ids = []
            for item in layout:
                ids = item.get("tasks")
                if not isinstance(ids, list) or any(
                    not isinstance(i, str) for i in ids
                ):
                    return Response(
                        {"detail": "Formato de tareas inválido."}, status=400
                    )
                task_ids.extend(ids)
            if (
                any(not isinstance(i, str) for i in column_ids)
                or len(column_ids) != len(columns)
                or set(column_ids) != set(columns)
                or len(task_ids) != len(tasks)
                or set(task_ids) != set(tasks)
            ):
                return Response(
                    {"detail": "El tablero cambió. Actualiza antes de reorganizar."},
                    status=409,
                )
            for index, item in enumerate(layout):
                columns[item["id"]].order = index
                for order, task_id in enumerate(item["tasks"]):
                    tasks[task_id].column = columns[item["id"]]
                    tasks[task_id].order = order
            Column.objects.bulk_update(list(columns.values()), ["order"])
            Task.objects.bulk_update(list(tasks.values()), ["column", "order"])
        return Response({"status": "ok"})

    @action(detail=True, methods=["get"])
    def history(self, request, pk=None):
        messages = self.get_object().chat_messages.filter(user=request.user)
        return Response(ChatMessageSerializer(messages, many=True).data)

    @action(detail=True, methods=["post"])
    def ask(self, request, pk=None):
        project = self.get_object()
        if not capabilities()["rag_available"]:
            return Response(
                {
                    "code": "ai_disabled",
                    "detail": "El asistente está temporalmente deshabilitado.",
                },
                status=503,
            )
        question = request.data.get("question")
        if (
            not isinstance(question, str)
            or not question.strip()
            or len(question) > 4000
        ):
            return Response(
                {"detail": "Escribe una pregunta de hasta 4000 caracteres."}, status=400
            )
        try:
            vector = embed(question)
            chunks = list(
                TaskEmbedding.objects.filter(task__column__project=project).order_by(
                    L2Distance("embedding", vector)
                )[:3]
            )
            if not chunks:
                return Response(
                    {
                        "code": "no_context",
                        "detail": "Este proyecto aún no tiene tareas indexadas.",
                    },
                    status=409,
                )
            context = "\n".join(f"- {chunk.text_chunk}" for chunk in chunks)
            prompt = f"Usando el contexto, responde de forma concisa.\n{context}\nPregunta: {question}\nRespuesta:"
            response = requests.post(
                f"{settings.OLLAMA_URL.rstrip('/')}/api/generate",
                json={
                    "model": settings.OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                },
                timeout=settings.OLLAMA_TIMEOUT,
            )
            response.raise_for_status()
            answer = response.json().get("response")
            if not isinstance(answer, str) or not answer.strip():
                raise ValueError("Empty model response")
        except (requests.RequestException, ValueError, OSError, RuntimeError):
            return Response(
                {
                    "code": "ai_unavailable",
                    "detail": "El asistente no está disponible. Inténtalo más tarde.",
                },
                status=503,
            )
        with transaction.atomic():
            ChatMessage.objects.create(
                project=project, user=request.user, sender="user", message=question
            )
            ChatMessage.objects.create(
                project=project, user=request.user, sender="ai", message=answer
            )
        return Response({"answer": answer, "prompt_used": prompt})


class ColumnViewSet(viewsets.ModelViewSet):
    serializer_class = ColumnSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Column.objects.filter(project__owner=self.request.user).prefetch_related(
            "tasks"
        )


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(column__project__owner=self.request.user).order_by(
            "order", "created_at"
        )


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
