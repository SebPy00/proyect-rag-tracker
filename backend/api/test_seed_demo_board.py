from io import StringIO
import sys
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.management import call_command, CommandError
from django.test import TestCase, override_settings

from api.management.commands.seed_demo_board import (
    DEMO_COLUMNS,
    DEMO_DESCRIPTION,
    DEMO_NAME,
)
from api.models import Column, Project, Task, TaskEmbedding


@override_settings(AI_ENABLED=False, EMBEDDINGS_ENABLED=False)
class SeedDemoBoardTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.owner = get_user_model().objects.create_user(username="demo-owner")
        cls.other = get_user_model().objects.create_user(username="other-owner")
        cls.existing_project = Project.objects.create(
            owner=cls.owner, name="Proyecto existente", description="No modificar"
        )
        cls.existing_column = Column.objects.create(
            project=cls.existing_project, title="Trabajo real", order=7
        )
        cls.existing_task = Task.objects.create(
            column=cls.existing_column,
            title="Conservar",
            description="Contenido original",
            order=9,
        )

    def seed(self, username="demo-owner", **options):
        output = StringIO()
        call_command("seed_demo_board", username=username, stdout=output, **options)
        return output.getvalue()

    def snapshot(self):
        return {
            model.__name__: list(model.objects.order_by("pk").values())
            for model in [get_user_model(), Project, Column, Task, TaskEmbedding]
        }

    def test_creates_exact_content_order_and_owner_without_ai(self):
        with patch("api.ai.embed", side_effect=AssertionError("Must not load AI")):
            output = self.seed()
        project = Project.objects.get(owner=self.owner, name=DEMO_NAME)
        self.assertEqual(project.description, DEMO_DESCRIPTION)
        columns = list(project.columns.order_by("order"))
        self.assertEqual(
            [column.title for column in columns],
            ["BACKLOG", "POR HACER", "EN PROGRESO", "EN REVISIÓN", "FINALIZADO"],
        )
        self.assertEqual([column.order for column in columns], list(range(5)))
        self.assertEqual(Task.objects.filter(column__project=project).count(), 15)
        for column, (_, tasks) in zip(columns, DEMO_COLUMNS):
            self.assertEqual(
                list(
                    column.tasks.order_by("order").values_list(
                        "title", "description", "order"
                    )
                ),
                [
                    (title, description, order)
                    for order, (title, description) in enumerate(tasks)
                ],
            )
        self.assertFalse(TaskEmbedding.objects.exists())
        self.assertNotIn("sentence_transformers", sys.modules)
        self.assertIn("1 proyecto, 5 columnas y 15 tareas", output)
        self.existing_task.refresh_from_db()
        self.assertEqual(
            (
                self.existing_task.title,
                self.existing_task.description,
                self.existing_task.order,
            ),
            ("Conservar", "Contenido original", 9),
        )
        self.assertFalse(Project.objects.filter(owner=self.other).exists())

    def test_idempotence_preserves_edited_moved_and_deleted_demo_content(self):
        self.seed()
        project = Project.objects.get(owner=self.owner, name=DEMO_NAME)
        project.description = "Descripción editada"
        project.save()
        column = project.columns.get(order=0)
        column.title = "Backlog personalizado"
        column.order = 8
        column.save()
        task = Task.objects.filter(column__project=project).first()
        task.title = "Editada a mano"
        task.description = "No sobrescribir"
        task.column = project.columns.get(order=1)
        task.order = 12
        task.save()
        Task.objects.filter(column__project=project).exclude(
            pk=task.pk
        ).first().delete()
        before = self.snapshot()
        output = self.seed()
        self.assertEqual(self.snapshot(), before)
        self.assertIn("Omitido completo", output)
        self.assertEqual(
            Project.objects.filter(owner=self.owner, name=DEMO_NAME).count(), 1
        )
        self.assertEqual(Task.objects.filter(column__project=project).count(), 14)

    def test_same_name_for_another_owner_is_independent(self):
        self.seed()
        self.seed(username=self.other.username)
        self.assertEqual(Project.objects.filter(name=DEMO_NAME).count(), 2)
        for owner in [self.owner, self.other]:
            self.assertEqual(
                Task.objects.filter(
                    column__project__owner=owner, column__project__name=DEMO_NAME
                ).count(),
                15,
            )
        before = self.snapshot()
        self.seed(username=self.other.username)
        self.assertEqual(self.snapshot(), before)

    def test_dry_run_creates_nothing_and_does_not_generate_embeddings(self):
        before = self.snapshot()
        with (
            patch("api.ai.embed", side_effect=AssertionError("Must not load AI")),
            patch.object(
                Project.objects,
                "create",
                side_effect=AssertionError("Must not create a project"),
            ),
        ):
            output = self.seed(dry_run=True)
        self.assertEqual(self.snapshot(), before)
        self.assertIn("Se crearían 1 proyecto, 5 columnas y 15 tareas", output)
        for title, _ in DEMO_COLUMNS:
            self.assertIn(title, output)

    def test_dry_run_existing_board_skips_without_modification(self):
        self.seed()
        before = self.snapshot()
        output = self.seed(dry_run=True)
        self.assertEqual(self.snapshot(), before)
        self.assertIn("[DRY RUN]", output)
        self.assertIn("Omitido completo", output)

    def test_missing_user_fails_without_writes_in_both_modes(self):
        before = self.snapshot()
        for dry_run in [False, True]:
            with self.assertRaisesMessage(CommandError, "No existe el usuario"):
                self.seed(username="missing", dry_run=dry_run)
            self.assertEqual(self.snapshot(), before)

    def test_failure_rolls_back_project_columns_and_tasks(self):
        before = self.snapshot()
        original_create = Task.objects.create
        count = 0

        def fail_after_two_tasks(**kwargs):
            nonlocal count
            count += 1
            if count == 3:
                raise RuntimeError("simulated failure")
            return original_create(**kwargs)

        with patch.object(Task.objects, "create", side_effect=fail_after_two_tasks):
            with self.assertRaisesMessage(RuntimeError, "simulated failure"):
                self.seed()
        self.assertEqual(self.snapshot(), before)

    def test_preexisting_incomplete_board_is_not_completed_or_overwritten(self):
        project = Project.objects.create(
            owner=self.owner, name=DEMO_NAME, description="Conservar"
        )
        Column.objects.create(project=project, title="Personalizada", order=4)
        before = self.snapshot()
        self.seed()
        self.assertEqual(self.snapshot(), before)
