from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from api.models import Task, TaskEmbedding
from api.ai import embed


class Command(BaseCommand):
    help = "Rebuild task vectors after enabling embeddings. Run during a maintenance window."

    def handle(self, **options):
        if not settings.EMBEDDINGS_ENABLED:
            raise CommandError(
                "Enable EMBEDDINGS_ENABLED and install AI dependencies first."
            )
        count = 0
        for task in Task.objects.order_by("pk").iterator(chunk_size=100):
            text = f"Título: {task.title}. Descripción: {task.description or ''}"
            vector = embed(text)
            with transaction.atomic():
                TaskEmbedding.objects.filter(task=task).delete()
                TaskEmbedding.objects.create(
                    task=task, text_chunk=text, embedding=vector
                )
            count += 1
        self.stdout.write(self.style.SUCCESS(f"Indexed {count} tasks."))
