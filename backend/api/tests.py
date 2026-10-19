import sys
from unittest.mock import patch
from django.contrib.auth.models import User
from django.test import override_settings
from rest_framework.test import APITestCase
from .models import Project, Column, Task, TaskEmbedding, ChatMessage


@override_settings(
    AI_ENABLED=False, EMBEDDINGS_ENABLED=False, SECURE_SSL_REDIRECT=False
)
class KanbanTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.owner = User.objects.create_user("owner", password="Strong-local-329!")
        cls.other = User.objects.create_user("other", password="Strong-local-329!")
        cls.project = Project.objects.create(owner=cls.owner, name="Workspace")
        cls.foreign = Project.objects.create(owner=cls.other, name="Private")
        cls.column = Column.objects.create(project=cls.project, title="Todo", order=0)
        cls.foreign_column = Column.objects.create(
            project=cls.foreign, title="Private", order=0
        )

    def setUp(self):
        self.client.force_authenticate(self.owner)

    def test_crud_without_ml_dependencies(self):
        self.assertNotIn("sentence_transformers", sys.modules)
        response = self.client.post("/api/projects/", {"name": "New"})
        self.assertEqual(response.status_code, 201)
        project_id = response.data["id"]
        response = self.client.post(
            "/api/columns/", {"project": project_id, "title": "Todo", "order": 0}
        )
        self.assertEqual(response.status_code, 201)
        column_id = response.data["id"]
        with patch("api.ai.embed", side_effect=AssertionError("ML must stay unloaded")):
            response = self.client.post(
                "/api/tasks/", {"column": column_id, "title": "Ship", "order": 0}
            )
            self.assertEqual(response.status_code, 201)
            task_id = response.data["id"]
            self.assertEqual(
                self.client.patch(
                    f"/api/tasks/{task_id}/", {"title": "Shipped"}
                ).status_code,
                200,
            )
        self.assertEqual(TaskEmbedding.objects.count(), 0)
        self.assertEqual(
            self.client.get(f"/api/projects/{project_id}/").data["columns"][0]["tasks"][
                0
            ]["title"],
            "Shipped",
        )
        self.assertEqual(
            self.client.patch(
                f"/api/columns/{column_id}/", {"title": "Done", "order": 1}
            ).status_code,
            200,
        )
        self.assertEqual(
            self.client.patch(
                f"/api/projects/{project_id}/", {"name": "Release"}
            ).status_code,
            200,
        )
        self.assertEqual(self.client.delete(f"/api/tasks/{task_id}/").status_code, 204)
        self.assertEqual(
            self.client.delete(f"/api/columns/{column_id}/").status_code, 204
        )
        self.assertEqual(
            self.client.delete(f"/api/projects/{project_id}/").status_code, 204
        )
        self.assertNotIn("sentence_transformers", sys.modules)

    def test_owner_scope_and_parent_validation(self):
        self.assertEqual(len(self.client.get("/api/projects/").data), 1)
        self.assertEqual(
            self.client.get(f"/api/projects/{self.foreign.pk}/").status_code, 404
        )
        self.assertEqual(
            self.client.post(
                "/api/columns/",
                {"project": self.foreign.pk, "title": "Attack", "order": 0},
            ).status_code,
            400,
        )
        self.assertEqual(
            self.client.patch(
                f"/api/columns/{self.column.pk}/", {"project": self.foreign.pk}
            ).status_code,
            400,
        )
        self.assertEqual(
            self.client.post(
                "/api/tasks/",
                {"column": self.foreign_column.pk, "title": "Attack", "order": 0},
            ).status_code,
            400,
        )
        task = Task.objects.create(column=self.column, title="Owned", order=0)
        self.assertEqual(
            self.client.patch(
                f"/api/tasks/{task.pk}/", {"column": self.foreign_column.pk}
            ).status_code,
            400,
        )
        self.client.force_authenticate(self.other)
        for method in [self.client.get, self.client.delete]:
            self.assertEqual(method(f"/api/tasks/{task.pk}/").status_code, 404)
        self.assertEqual(
            self.client.patch(
                f"/api/tasks/{task.pk}/", {"title": "Attack"}
            ).status_code,
            404,
        )

    def test_move_task_between_owned_columns(self):
        destination = Column.objects.create(project=self.project, title="Done", order=1)
        task = Task.objects.create(column=self.column, title="Move", order=0)
        response = self.client.patch(
            f"/api/tasks/{task.pk}/", {"column": destination.pk, "order": 2}
        )
        self.assertEqual(response.status_code, 200)
        task.refresh_from_db()
        self.assertEqual(task.column_id, destination.pk)
        self.assertEqual(task.order, 2)

    def test_reorder_atomic_and_owner_scoped(self):
        second = Column.objects.create(project=self.project, title="Done", order=1)
        task = Task.objects.create(column=self.column, title="Move", order=0)
        path = f"/api/projects/{self.project.pk}/reorder/"
        layout = [
            {"id": str(second.pk), "tasks": [str(task.pk)]},
            {"id": str(self.column.pk), "tasks": []},
        ]
        self.assertEqual(
            self.client.post(path, {"columns": layout}, format="json").status_code, 200
        )
        task.refresh_from_db()
        self.assertEqual(task.column_id, second.pk)
        self.assertEqual(task.order, 0)
        invalid = [{"id": str(self.column.pk), "tasks": []}]
        self.assertEqual(
            self.client.post(path, {"columns": invalid}, format="json").status_code, 409
        )
        second.refresh_from_db()
        self.assertEqual(second.order, 0)
        self.assertEqual(
            self.client.post(
                f"/api/projects/{self.foreign.pk}/reorder/",
                {"columns": []},
                format="json",
            ).status_code,
            404,
        )

    def test_disabled_ai_never_writes_history(self):
        self.assertEqual(
            self.client.get("/api/capabilities/").data,
            {"ai_enabled": False, "embeddings_enabled": False, "rag_available": False},
        )
        with patch("api.views.embed", side_effect=AssertionError("Must not embed")):
            response = self.client.post(
                f"/api/projects/{self.project.pk}/ask/", {"question": "Help"}
            )
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.data["code"], "ai_disabled")
        self.assertFalse(ChatMessage.objects.exists())
        self.assertEqual(
            self.client.get(f"/api/projects/{self.project.pk}/history/").data, []
        )

    @override_settings(AI_ENABLED=True, EMBEDDINGS_ENABLED=True)
    def test_ollama_failure_is_controlled_without_fake_history(self):
        import requests

        # bulk_create intentionally bypasses the embedding signal: this test supplies its vector.
        task = Task(column=self.column, title="Context", order=0)
        Task.objects.bulk_create([task])
        TaskEmbedding.objects.create(
            task=task, text_chunk="Context", embedding=[0.0] * 384
        )
        with (
            patch("api.views.embed", return_value=[0.0] * 384),
            patch("api.views.requests.post", side_effect=requests.Timeout),
        ):
            response = self.client.post(
                f"/api/projects/{self.project.pk}/ask/", {"question": "Help"}
            )
        self.assertEqual(response.status_code, 503)
        self.assertFalse(ChatMessage.objects.exists())

    def test_rag_requires_both_capabilities(self):
        for ai, embeddings in [(True, False), (False, True)]:
            with self.settings(AI_ENABLED=ai, EMBEDDINGS_ENABLED=embeddings):
                with patch(
                    "api.views.embed", side_effect=AssertionError("Must not embed")
                ):
                    response = self.client.post(
                        f"/api/projects/{self.project.pk}/ask/", {"question": "Help"}
                    )
                self.assertEqual(response.status_code, 503)
                self.assertFalse(
                    self.client.get("/api/capabilities/").data["rag_available"]
                )
        self.assertFalse(ChatMessage.objects.exists())

    @override_settings(AI_ENABLED=True, EMBEDDINGS_ENABLED=True)
    def test_embedding_loading_failure_is_controlled(self):
        from .ai import AIUnavailable

        with patch("api.views.embed", side_effect=AIUnavailable("offline")):
            response = self.client.post(
                f"/api/projects/{self.project.pk}/ask/", {"question": "Help"}
            )
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.data["code"], "ai_unavailable")
        self.assertFalse(ChatMessage.objects.exists())

    def test_anonymous_denied_and_health_public(self):
        self.client.force_authenticate(None)
        for path in [
            "/api/projects/",
            "/api/tasks/",
            "/api/columns/",
            "/api/capabilities/",
            "/api/me/",
        ]:
            self.assertEqual(self.client.get(path).status_code, 401)
        self.assertEqual(self.client.get("/api/health/").data, {"status": "ok"})

    def test_login_refresh_me(self):
        self.client.force_authenticate(None)
        response = self.client.post(
            "/auth/jwt/create/", {"username": "owner", "password": "Strong-local-329!"}
        )
        self.assertEqual(response.status_code, 200)
        refreshed = self.client.post(
            "/auth/jwt/refresh/", {"refresh": response.data["refresh"]}
        )
        self.assertEqual(refreshed.status_code, 200)
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + refreshed.data["access"])
        self.assertEqual(self.client.get("/api/me/").data["username"], "owner")


@override_settings(SECURE_SSL_REDIRECT=False)
class UserPermissionTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.regular = User.objects.create_user("regular", password="Strong-local-329!")
        cls.staff = User.objects.create_user(
            "staff", password="Strong-local-329!", is_staff=True
        )
        cls.root = User.objects.create_superuser("root", password="Strong-local-329!")

    def test_all_admin_operations_forbidden_to_regular_user(self):
        self.client.force_authenticate(self.regular)
        path = f"/api/users/{self.staff.pk}/"
        self.assertEqual(self.client.get("/api/users/").status_code, 403)
        self.assertEqual(
            self.client.post("/api/users/", {"username": "intruder"}).status_code, 403
        )
        for method in [self.client.patch, self.client.put]:
            self.assertEqual(method(path, {"is_staff": True}).status_code, 403)
        self.assertEqual(self.client.delete(path).status_code, 403)
        self.client.force_authenticate(None)
        self.assertEqual(self.client.post("/auth/users/", {}).status_code, 404)

    def test_staff_cannot_escalate_or_modify_admins(self):
        self.client.force_authenticate(self.staff)
        self.assertEqual(self.client.get("/api/users/").status_code, 200)
        self.assertEqual(
            self.client.patch(
                f"/api/users/{self.regular.pk}/", {"is_staff": True}
            ).status_code,
            400,
        )
        self.assertEqual(
            self.client.patch(
                f"/api/users/{self.root.pk}/", {"username": "hijack"}
            ).status_code,
            403,
        )
        self.assertEqual(
            self.client.delete(f"/api/users/{self.root.pk}/").status_code, 403
        )
        self.assertEqual(
            self.client.post(
                "/api/users/",
                {
                    "username": "newadmin",
                    "password": "Strong-local-329!",
                    "is_staff": True,
                },
            ).status_code,
            400,
        )

    def test_password_hash_and_admin_crud(self):
        self.client.force_authenticate(self.staff)
        response = self.client.post(
            "/api/users/", {"username": "newuser", "password": "Strong-local-329!"}
        )
        self.assertEqual(response.status_code, 201)
        user = User.objects.get(pk=response.data["id"])
        self.assertTrue(user.check_password("Strong-local-329!"))
        self.assertTrue(user.is_active)
        self.assertNotIn("password", response.data)
        self.assertEqual(
            self.client.patch(
                f"/api/users/{user.pk}/", {"is_active": False}
            ).status_code,
            200,
        )
        self.assertEqual(self.client.delete(f"/api/users/{user.pk}/").status_code, 204)
        self.assertEqual(
            self.client.post(
                "/api/users/", {"username": "weak", "password": "123"}
            ).status_code,
            400,
        )

    def test_superuser_privileges_and_self_protection(self):
        self.client.force_authenticate(self.root)
        self.assertEqual(
            self.client.patch(
                f"/api/users/{self.regular.pk}/", {"is_staff": True}
            ).status_code,
            200,
        )
        self.assertEqual(
            self.client.patch(
                f"/api/users/{self.regular.pk}/", {"is_superuser": True}
            ).status_code,
            400,
        )
        self.assertEqual(
            self.client.patch(
                f"/api/users/{self.root.pk}/", {"is_active": False}
            ).status_code,
            400,
        )
        self.assertEqual(
            self.client.delete(f"/api/users/{self.root.pk}/").status_code, 403
        )
