FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /app
COPY requirements.txt requirements-ai.txt ./
ARG INSTALL_AI=false
RUN --mount=type=secret,id=build_ca,required=false \
    if [ -f /run/secrets/build_ca ]; then export PIP_CERT=/run/secrets/build_ca; fi; \
    pip install -r requirements.txt && if [ "$INSTALL_AI" = "true" ]; then pip install torch --index-url https://download.pytorch.org/whl/cpu && pip install -r requirements-ai.txt; fi
RUN useradd --create-home --uid 10001 app && mkdir -p /home/app/.cache/huggingface && chown -R app:app /home/app/.cache
COPY --chown=app:app . .
RUN DEBUG=true AI_ENABLED=false EMBEDDINGS_ENABLED=false python manage.py collectstatic --noinput && chown -R app:app /app/staticfiles
USER app
EXPOSE 8000
CMD ["gunicorn", "myproject.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2", "--threads", "2", "--timeout", "180", "--access-logfile", "-", "--error-logfile", "-"]
