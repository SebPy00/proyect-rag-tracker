"""Optional AI boundary: importing this module never imports ML libraries."""

from functools import lru_cache
from django.conf import settings


@lru_cache(maxsize=1)
def embedding_model():
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(settings.EMBEDDING_MODEL)


class AIUnavailable(RuntimeError):
    """Model loading and inference failed at the optional dependency boundary."""


def embed(text):
    try:
        return embedding_model().encode(text)
    except Exception as error:
        raise AIUnavailable("Embedding service unavailable") from error


def capabilities():
    return {
        "ai_enabled": settings.AI_ENABLED,
        "embeddings_enabled": settings.EMBEDDINGS_ENABLED,
        "rag_available": settings.AI_ENABLED and settings.EMBEDDINGS_ENABLED,
    }
