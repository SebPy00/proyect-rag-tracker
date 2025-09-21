from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Task, TaskEmbedding
from sentence_transformers import SentenceTransformer

# Cargamos el modelo de IA una sola vez cuando el servidor arranca.
# La primera vez, Django lo descargará, lo que puede tardar un poco.
model = SentenceTransformer('all-MiniLM-L6-v2')

@receiver(post_save, sender=Task)
def update_task_embedding(sender, instance, created, **kwargs):
    """
    Esta función se ejecuta cada vez que una Tarea es creada o actualizada.
    """
    # Combinamos el título y la descripción para tener todo el contexto.
    text_to_embed = f"Título: {instance.title}. Descripción: {instance.description or ''}"

    # Generamos el vector.
    embedding = model.encode(text_to_embed)

    # Borramos embeddings antiguos para esta tarea si existen.
    TaskEmbedding.objects.filter(task=instance).delete()

    # Creamos y guardamos el nuevo embedding.
    TaskEmbedding.objects.create(
        task=instance,
        text_chunk=text_to_embed,
        embedding=embedding
    )
    print(f"Embedding actualizado para la tarea: '{instance.title}'")