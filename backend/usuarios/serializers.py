from django.contrib.auth.models import User, Group
from rest_framework import serializers


class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ["id", "name"]


class UsuarioSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.SerializerMethodField()
    rol = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "nombre_completo",
            "rol",
            "is_active",
            "is_staff",
            "is_superuser",
            "last_login",
            "date_joined",
        ]

    def get_nombre_completo(self, obj):
        nombre = f"{obj.first_name} {obj.last_name}".strip()
        return nombre if nombre else obj.username

    def get_rol(self, obj):
        grupo = obj.groups.first()
        return grupo.name if grupo else "Sin rol"


class CrearUsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    rol = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "rol",
            "is_active",
        ]

    def create(self, validated_data):
        rol = validated_data.pop("rol", None)
        password = validated_data.pop("password")

        usuario = User(**validated_data)
        usuario.set_password(password)
        usuario.save()

        if rol:
            grupo, created = Group.objects.get_or_create(name=rol)
            usuario.groups.add(grupo)

        return usuario