from importlib.util import find_spec
from django.conf import settings
from django.core.checks import Error, register


@register()
def optional_ai_dependencies(app_configs, **kwargs):
    if settings.EMBEDDINGS_ENABLED and find_spec("sentence_transformers") is None:
        return [
            Error(
                "EMBEDDINGS_ENABLED requires requirements-ai.txt / INSTALL_AI=true.",
                id="api.E001",
            )
        ]
    return []
