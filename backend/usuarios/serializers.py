from django.contrib.auth.models import User, Group
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers


class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ["id", "name"]


class UsuarioSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.SerializerMethodField()
    rol = serializers.SerializerMethodField()
    groups_names = serializers.SerializerMethodField()

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
            "groups",
            "groups_names",
            "is_active",
            "is_staff",
            "is_superuser",
            "last_login",
            "date_joined",
        ]
        read_only_fields = [
            "id",
            "is_staff",
            "is_superuser",
            "last_login",
            "date_joined",
            "groups_names",
        ]
        extra_kwargs = {
            "groups": {"required": False},
        }

    def get_nombre_completo(self, obj):
        nombre = f"{obj.first_name} {obj.last_name}".strip()
        return nombre if nombre else obj.username

    def get_rol(self, obj):
        grupo = obj.groups.first()
        return grupo.name if grupo else "Sin rol"

    def get_groups_names(self, obj):
        return [grupo.name for grupo in obj.groups.all()]


class CrearUsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    rol = serializers.CharField(write_only=True, required=False, allow_blank=True)
    groups = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(),
        many=True,
        required=False,
        write_only=True,
    )

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "rol",
            "groups",
            "is_active",
        ]

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate_rol(self, value):
        if not value:
            return value

        if not Group.objects.filter(name=value).exists():
            raise serializers.ValidationError(
                "El rol seleccionado no existe en el sistema."
            )

        return value

    def create(self, validated_data):
        rol = validated_data.pop("rol", None)
        grupos = validated_data.pop("groups", [])
        password = validated_data.pop("password")

        usuario = User(**validated_data)
        usuario.set_password(password)
        usuario.save()

        if grupos:
            usuario.groups.set(grupos)
        elif rol:
            grupo = Group.objects.get(name=rol)
            usuario.groups.add(grupo)

        return usuario

    def update(self, instance, validated_data):
        rol = validated_data.pop("rol", None)
        grupos = validated_data.pop("groups", None)
        password = validated_data.pop("password", None)

        for campo, valor in validated_data.items():
            setattr(instance, campo, valor)

        if password:
            validate_password(password, user=instance)
            instance.set_password(password)

        instance.save()

        if grupos is not None:
            instance.groups.set(grupos)
        elif rol:
            grupo = Group.objects.get(name=rol)
            instance.groups.set([grupo])

        return instance
