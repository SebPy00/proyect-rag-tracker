from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAdminUser
from rest_framework.exceptions import PermissionDenied
from django.contrib.auth.models import User
from .serializers import UserSerializer


class UserViewSet(ModelViewSet):
    queryset = User.objects.all().order_by("id")
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]

    def get_object(self):
        user = super().get_object()
        if self.request.method not in ("GET", "HEAD", "OPTIONS"):
            if (
                user.is_staff or user.is_superuser
            ) and not self.request.user.is_superuser:
                raise PermissionDenied(
                    "Solo un superusuario puede modificar administradores."
                )
        return user

    def perform_destroy(self, instance):
        if instance.pk == self.request.user.pk:
            raise PermissionDenied("No puedes eliminar tu propia cuenta.")
        instance.delete()
