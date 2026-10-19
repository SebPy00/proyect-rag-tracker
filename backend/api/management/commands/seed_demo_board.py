"""Explicit, non-destructive demo data creation. Never called during startup."""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from api.models import Column, Project, Task


DEMO_NAME = "DATALAB — Demo de Gestión de Proyectos"
DEMO_DESCRIPTION = (
    "Tablero demostrativo para visualizar el seguimiento de desarrollos, "
    "integraciones, pruebas y despliegues de software."
)
DEMO_COLUMNS = (
    (
        "BACKLOG",
        (
            (
                "Auditoría de accesos",
                "Evaluar un registro de actividad que permita consultar accesos y modificaciones realizadas por los usuarios.",
            ),
            (
                "Integración con sistema de tickets",
                "Analizar la conexión con una plataforma de soporte para centralizar incidencias y solicitudes técnicas.",
            ),
            (
                "Alertas operativas",
                "Definir notificaciones automáticas ante errores de sincronización y fallos de servicios.",
            ),
        ),
    ),
    (
        "POR HACER",
        (
            (
                "Definir flujo de estados",
                "Establecer las etapas y reglas necesarias para gestionar el ciclo de vida de las tareas.",
            ),
            (
                "Preparar pruebas automatizadas de API",
                "Implementar casos de prueba para autenticación, operaciones CRUD y validación de permisos.",
            ),
            (
                "Prototipo de dashboard ejecutivo",
                "Diseñar indicadores visuales que permitan consultar proyectos activos, tareas pendientes y avances.",
            ),
        ),
    ),
    (
        "EN PROGRESO",
        (
            (
                "Integración con Zoho CRM",
                "Implementar y probar una integración mediante API REST y webhooks, contemplando sincronización, autenticación e idempotencia.",
            ),
            (
                "API de oportunidades comerciales",
                "Desarrollar endpoints para consultar oportunidades con filtros, paginación y manejo de errores.",
            ),
            (
                "Interfaz de seguimiento de proyectos",
                "Mejorar la navegación, experiencia de usuario y visualización del tablero Kanban.",
            ),
        ),
    ),
    (
        "EN REVISIÓN",
        (
            (
                "Validación de permisos por usuario",
                "Comprobar que los usuarios únicamente accedan a los proyectos y recursos autorizados.",
            ),
            (
                "Pruebas de acceso HTTPS",
                "Verificar certificados internos, proxy inverso y encabezados de seguridad.",
            ),
            (
                "Restauración de backups PostgreSQL",
                "Validar que los respaldos puedan restaurarse correctamente en un entorno aislado.",
            ),
        ),
    ),
    (
        "FINALIZADO",
        (
            (
                "Preparación del entorno Docker",
                "Configurar los servicios de aplicación y base de datos mediante contenedores independientes.",
            ),
            (
                "Diseño del modelo de datos",
                "Definir entidades, relaciones y restricciones para proyectos, columnas, tareas y usuarios.",
            ),
            (
                "Implementación de autenticación JWT",
                "Incorporar inicio de sesión, tokens de acceso y renovación de sesiones.",
            ),
        ),
    ),
)


class Command(BaseCommand):
    help = "Crea un tablero DATALAB de demostración para un usuario existente, sin sobrescribir datos."

    def add_arguments(self, parser):
        parser.add_argument(
            "--username", required=True, help="Propietario existente del tablero."
        )
        parser.add_argument(
            "--dry-run", action="store_true", help="Muestra el plan sin escribir datos."
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        username = options["username"]
        task_count = sum(len(tasks) for _, tasks in DEMO_COLUMNS)
        with transaction.atomic():
            users = get_user_model().objects.all()
            if not dry_run:
                # No schema change is needed: serialize seeders for the same owner.
                users = users.select_for_update()
            try:
                owner = users.get(username=username)
            except get_user_model().DoesNotExist as error:
                raise CommandError(
                    f"No existe el usuario '{username}'. No se escribió ningún dato."
                ) from error

            existing = (
                Project.objects.filter(owner=owner, name=DEMO_NAME)
                .order_by("created_at", "pk")
                .first()
            )
            if existing:
                self.stdout.write(
                    f"{'[DRY RUN] ' if dry_run else ''}El tablero demostrativo ya existe para '{username}' "
                    f"(id={existing.pk}). Omitido completo: 0 proyectos, 0 columnas y 0 tareas creadas. "
                    "No se sobrescriben ni se reparan datos existentes."
                )
                return

            if dry_run:
                self.stdout.write(
                    f"[DRY RUN] Propietario: {username}. Proyecto: {DEMO_NAME}"
                )
                for order, (title, tasks) in enumerate(DEMO_COLUMNS):
                    self.stdout.write(
                        f"  Columna {order}: {title} ({len(tasks)} tareas, orden 0–{len(tasks) - 1})"
                    )
                self.stdout.write(
                    f"[DRY RUN] Se crearían 1 proyecto, {len(DEMO_COLUMNS)} columnas y {task_count} tareas. "
                    "No se escribió ningún dato."
                )
                return

            project = Project.objects.create(
                owner=owner, name=DEMO_NAME, description=DEMO_DESCRIPTION
            )
            for column_order, (title, tasks) in enumerate(DEMO_COLUMNS):
                column = Column.objects.create(
                    project=project, title=title, order=column_order
                )
                for task_order, (task_title, description) in enumerate(tasks):
                    Task.objects.create(
                        column=column,
                        title=task_title,
                        description=description,
                        order=task_order,
                    )

        # Only report success after the transaction has committed.
        self.stdout.write(
            self.style.SUCCESS(
                f"Creado tablero demostrativo '{DEMO_NAME}' (id={project.pk}) para '{username}': "
                f"1 proyecto, {len(DEMO_COLUMNS)} columnas y {task_count} tareas."
            )
        )
