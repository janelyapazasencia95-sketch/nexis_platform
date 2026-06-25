from rest_framework.decorators import permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from django.contrib.auth import authenticate
from django.contrib.auth.models import User, Group
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token

from .serializers import UsuarioSerializer, CrearUsuarioSerializer, RolSerializer


@api_view(["POST"])
def login_usuario(request):
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response(
            {"error": "Usuario y contraseña son obligatorios."},
            status=status.HTTP_400_BAD_REQUEST
        )

    usuario = authenticate(username=username, password=password)

    if usuario is None:
        return Response(
            {"error": "Credenciales incorrectas."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not usuario.is_active:
        return Response(
            {"error": "El usuario está inactivo."},
            status=status.HTTP_403_FORBIDDEN
        )

    token, created = Token.objects.get_or_create(user=usuario)

    return Response({
        "mensaje": "Inicio de sesión correcto.",
        "token": token.key,
        "usuario": UsuarioSerializer(usuario).data,
    })


@api_view(["GET"])
def usuario_actual(request):
    if request.user.is_authenticated:
        return Response(UsuarioSerializer(request.user).data)

    return Response({
        "id": 1,
        "username": "admin",
        "email": "admin@nexis.pe",
        "nombre_completo": "Administrador",
        "rol": "Administrador",
        "is_active": True,
        "is_staff": True,
        "is_superuser": True,
    })


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("-date_joined")

    def get_serializer_class(self):
        if self.action == "create":
            return CrearUsuarioSerializer
        return UsuarioSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        buscar = self.request.query_params.get("buscar")
        activo = self.request.query_params.get("activo")

        if buscar:
            queryset = queryset.filter(username__icontains=buscar) | queryset.filter(email__icontains=buscar)

        if activo in ["true", "false"]:
            queryset = queryset.filter(is_active=(activo == "true"))

        return queryset

    @action(detail=True, methods=["patch"])
    def activar(self, request, pk=None):
        usuario = self.get_object()
        usuario.is_active = True
        usuario.save()

        return Response({
            "mensaje": "Usuario activado correctamente.",
            "usuario": UsuarioSerializer(usuario).data
        })

    @action(detail=True, methods=["patch"])
    def desactivar(self, request, pk=None):
        usuario = self.get_object()

        if usuario.is_superuser:
            return Response(
                {"error": "No se puede desactivar el administrador principal."},
                status=status.HTTP_400_BAD_REQUEST
            )

        usuario.is_active = False
        usuario.save()

        return Response({
            "mensaje": "Usuario desactivado correctamente.",
            "usuario": UsuarioSerializer(usuario).data
        })

    @action(detail=False, methods=["get"])
    def resumen(self, request):
        total = User.objects.count()
        activos = User.objects.filter(is_active=True).count()
        administradores = User.objects.filter(is_staff=True).count()
        operadores = User.objects.filter(groups__name="Operador").count()

        return Response({
            "total_usuarios": total,
            "usuarios_activos": activos,
            "administradores": administradores,
            "operadores": operadores,
        })


class RolViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all().order_by("name")
    serializer_class = RolSerializer


# ============================================================
# LOGIN PÚBLICO CORREGIDO - NEXIS
# ============================================================

from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response(
            {"error": "Debe ingresar usuario y contraseña."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(username=username, password=password)

    if user is None:
        return Response(
            {"error": "Usuario o contraseña incorrectos."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not user.is_active:
        return Response(
            {"error": "Usuario inactivo."},
            status=status.HTTP_403_FORBIDDEN,
        )

    token, created = Token.objects.get_or_create(user=user)

    return Response(
        {
            "mensaje": "Inicio de sesión correcto.",
            "token": token.key,
            "usuario": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "nombre_completo": user.get_full_name() or user.username,
                "rol": user.groups.first().name if user.groups.exists() else "Sin rol",
                "is_active": user.is_active,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
                "last_login": user.last_login,
                "date_joined": user.date_joined,
            },
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    user = request.user

    return Response(
        {
            "usuario": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "nombre_completo": user.get_full_name() or user.username,
                "rol": user.groups.first().name if user.groups.exists() else "Sin rol",
                "is_active": user.is_active,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
                "last_login": user.last_login,
                "date_joined": user.date_joined,
            }
        },
        status=status.HTTP_200_OK,
    )

# ============================================================
# SEGURIDAD DE USUARIOS Y ROLES - NEXIS
# Solo administradores pueden gestionar usuarios y roles.
# ============================================================

from rest_framework.permissions import IsAdminUser

UsuarioViewSet.permission_classes = [IsAdminUser]
RolViewSet.permission_classes = [IsAdminUser]
