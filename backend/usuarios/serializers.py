from django.contrib.auth.models import User, Group
from rest_framework import serializers

from .models import PerfilUsuario


class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ["id", "name"]


class UsuarioSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.SerializerMethodField()
    rol = serializers.SerializerMethodField()
    groups_names = serializers.SerializerMethodField()
    foto_perfil_url = serializers.SerializerMethodField()

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
            "foto_perfil_url",
            "is_active",
            "is_staff",
            "is_superuser",
            "last_login",
            "date_joined",
        ]
        read_only_fields = [
            "id",
            "groups_names",
            "foto_perfil_url",
            "is_staff",
            "is_superuser",
            "last_login",
            "date_joined",
        ]
        extra_kwargs = {
            "groups": {"required": False},
        }

    def get_nombre_completo(self, obj):
        nombre = f"{obj.first_name} {obj.last_name}".strip()
        return nombre if nombre else obj.username

    def get_rol(self, obj):
        grupo = obj.groups.first()
        if grupo:
            return grupo.name
        if obj.is_superuser or obj.is_staff:
            return "Administrador"
        return "Sin rol"

    def get_groups_names(self, obj):
        return [grupo.name for grupo in obj.groups.all()]

    def get_foto_perfil_url(self, obj):
        perfil = getattr(obj, "perfil", None)

        if not perfil or not perfil.foto_perfil:
            return ""

        url = perfil.foto_perfil.url
        request = self.context.get("request")

        if request:
            return request.build_absolute_uri(url)

        return url


class CrearUsuarioSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
    )
    password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
    )
    rol = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
    )
    groups = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(),
        many=True,
        required=False,
        write_only=True,
    )
    foto_perfil = serializers.ImageField(
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "nombre_completo",
            "password",
            "rol",
            "groups",
            "foto_perfil",
            "is_active",
        ]

    def validate(self, attrs):
        if self.instance is None and not attrs.get("password"):
            raise serializers.ValidationError({
                "password": "La contraseña es obligatoria para crear un usuario."
            })
        return attrs

    def _aplicar_nombre_completo(self, usuario, nombre_completo):
        if not nombre_completo:
            return

        partes = nombre_completo.strip().split()
        usuario.first_name = partes[0] if partes else ""
        usuario.last_name = " ".join(partes[1:]) if len(partes) > 1 else ""

    def _obtener_grupo_por_rol(self, rol):
        if not rol:
            return None

        if str(rol).isdigit():
            return Group.objects.filter(id=int(rol)).first()

        return Group.objects.filter(name=rol).first()

    def _asignar_roles(self, usuario, grupos=None, rol=None):
        if grupos is not None:
            usuario.groups.set(grupos)
            return

        grupo = self._obtener_grupo_por_rol(rol)
        if grupo:
            usuario.groups.set([grupo])

    def _guardar_foto(self, usuario, foto):
        if not foto:
            return

        perfil, _ = PerfilUsuario.objects.get_or_create(user=usuario)

        if perfil.foto_perfil:
            perfil.foto_perfil.delete(save=False)

        perfil.foto_perfil = foto
        perfil.save()

    def create(self, validated_data):
        nombre_completo = validated_data.pop("nombre_completo", "")
        password = validated_data.pop("password", "")
        rol = validated_data.pop("rol", "")
        grupos = validated_data.pop("groups", None)
        foto = validated_data.pop("foto_perfil", None)

        usuario = User(**validated_data)
        self._aplicar_nombre_completo(usuario, nombre_completo)

        usuario.set_password(password)
        usuario.save()

        self._asignar_roles(usuario, grupos=grupos, rol=rol)
        self._guardar_foto(usuario, foto)

        return usuario

    def update(self, instance, validated_data):
        nombre_completo = validated_data.pop("nombre_completo", "")
        password = validated_data.pop("password", "")
        rol = validated_data.pop("rol", "")
        grupos = validated_data.pop("groups", None)
        foto = validated_data.pop("foto_perfil", None)

        for campo, valor in validated_data.items():
            setattr(instance, campo, valor)

        self._aplicar_nombre_completo(instance, nombre_completo)

        if password:
            instance.set_password(password)

        instance.save()

        self._asignar_roles(instance, grupos=grupos, rol=rol)
        self._guardar_foto(instance, foto)

        return instance

    def to_representation(self, instance):
        return UsuarioSerializer(instance, context=self.context).data
