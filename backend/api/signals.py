from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Task, TaskEmbedding


@receiver(post_save, sender=Task)
def update_task_embedding(sender, instance, **kwargs):
    if not settings.EMBEDDINGS_ENABLED:
        # Remove stale vectors when a task changes while embeddings are disabled.
        TaskEmbedding.objects.filter(task=instance).delete()
        return
    from .ai import embed

    text = f"Título: {instance.title}. Descripción: {instance.description or ''}"
    vector = embed(text)
    TaskEmbedding.objects.filter(task=instance).delete()
    TaskEmbedding.objects.create(task=instance, text_chunk=text, embedding=vector)
