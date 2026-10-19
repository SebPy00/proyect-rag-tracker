from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=False, allow_blank=False, trim_whitespace=False
    )
    is_active = serializers.BooleanField(required=False, default=True)

    class Meta:
        model = User
        fields = ["id", "username", "password", "is_active", "is_staff", "is_superuser"]
        read_only_fields = ["id", "is_superuser"]

    def validate(self, attrs):
        actor = self.context["request"].user
        if "is_superuser" in self.initial_data:
            raise serializers.ValidationError(
                {"is_superuser": "Usa un procedimiento administrativo explícito."}
            )
        if "is_staff" in self.initial_data and not actor.is_superuser:
            raise serializers.ValidationError(
                {"is_staff": "Solo un superusuario puede cambiar este permiso."}
            )
        if self.instance and self.instance.pk == actor.pk:
            if attrs.get("is_active") is False or attrs.get("is_staff") is False:
                raise serializers.ValidationError(
                    "No puedes desactivar tu propio acceso administrativo."
                )
        if not self.instance and not attrs.get("password"):
            raise serializers.ValidationError(
                {"password": "La contraseña es obligatoria."}
            )
        if "password" in attrs:
            candidate = self.instance or User(username=attrs.get("username", ""))
            try:
                validate_password(attrs["password"], candidate)
            except ValidationError as error:
                raise serializers.ValidationError({"password": error.messages})
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
