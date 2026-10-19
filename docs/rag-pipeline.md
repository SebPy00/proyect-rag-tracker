# Pipeline RAG opcional

El despliegue inicial de DataLab tiene `AI_ENABLED=false` y `EMBEDDINGS_ENABLED=false`. `GET /api/capabilities/` requiere autenticación y expone esos indicadores y `rag_available`. Es una señal de configuración, no un healthcheck del proveedor. El asistente no permite enviar preguntas si no está habilitado.

Django arranca y permite CRUD sin instalar Sentence Transformers/PyTorch. No hay carga de modelos en señales, vistas ni `AppConfig.ready`. El primer uso habilitado llama al modelo compartido de `api/ai.py`, almacenado mediante cache por proceso.

## Indexación

Con `EMBEDDINGS_ENABLED=true`, guardar una tarea combina título y descripción, calcula un vector con `EMBEDDING_MODEL` (por defecto `all-MiniLM-L6-v2`) y reemplaza su embedding. Con el indicador apagado no se calcula ningún vector y se eliminan embeddings obsoletos de la tarea editada. Reordenar tareas no recalcula vectores porque no modifica su texto.

El esquema requiere 384 dimensiones. Para indexar tareas existentes tras activar la función o cambiar el modelo, ejecuta `python manage.py reindex_tasks` con dependencias opcionales instaladas, indicadores configurados y escrituras pausadas. No uses modelos con dimensiones diferentes sin una migración y una reindexación planificadas.

## Preguntas

`POST /api/projects/{id}/ask/` verifica primero la propiedad del proyecto y la disponibilidad configurada. Deshabilitado devuelve 503/`ai_disabled` antes de calcular embeddings o escribir historial. Las preguntas deben ser texto no vacío de hasta 4000 caracteres.

Habilitado: calcula el vector de pregunta, recupera hasta tres embeddings del mismo proyecto ordenados por distancia L2 y construye un prompt en español con su texto. Sin contexto devuelve 409/`no_context`; no inventa una respuesta ni agrega mensajes al historial.

La generación llama a `${OLLAMA_URL}/api/generate` con `OLLAMA_MODEL`, `stream=false` y `OLLAMA_TIMEOUT`. Fallos de red/proveedor o respuestas vacías devuelven 503/`ai_unavailable`, con un mensaje genérico. Solo después de obtener una respuesta real se guardan la pregunta y respuesta en una transacción. El frontend muestra errores como alertas, no como mensajes del asistente.

`GET /api/projects/{id}/history/` conserva el contrato de mensajes `sender`, `text` y `created_at`, filtrados al usuario autenticado y ordenados por creación. El contenido se renderiza como texto, sin HTML del modelo.

No hay índices ANN, streaming ni cola de trabajos. La generación síncrona ocupa un worker; múltiples workers mantienen copias distintas del modelo. El modelo pequeño de CPU de ejemplo (`llama3.2:1b`) sigue requiriendo recursos adicionales. Mantén IA apagada en el host compartido de 8 GB hasta medir capacidad. El [README](../README.md) documenta activación, persistencia de modelos y límites.
