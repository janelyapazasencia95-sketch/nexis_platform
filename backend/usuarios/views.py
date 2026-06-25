from django.contrib.auth import authenticate
from django.contrib.auth.models import User, Group
from django.db.models import Q

from rest_framework import viewsets, status
from rest_framework.decorators import (
    api_view,
    action,
    permission_classes,
    authentication_classes,
    throttle_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.throttling import AnonRateThrottle

from .serializers import UsuarioSerializer, CrearUsuarioSerializer, RolSerializer


class LoginRateThrottle(AnonRateThrottle):
    rate = "5/min"


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
@throttle_classes([LoginRateThrottle])
def login_usuario(request):
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response(
            {"error": "Usuario y contraseña son obligatorios."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    usuario = authenticate(username=username, password=password)

    if usuario is None:
        return Response(
            {"error": "Credenciales incorrectas."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not usuario.is_active:
        return Response(
            {"error": "El usuario está inactivo."},
            status=status.HTTP_403_FORBIDDEN,
        )

    token, created = Token.objects.get_or_create(user=usuario)

    return Response(
        {
            "mensaje": "Inicio de sesión correcto.",
            "token": token.key,
            "usuario": UsuarioSerializer(usuario).data,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_usuario(request):
    Token.objects.filter(user=request.user).delete()

    return Response(
        {"mensaje": "Sesión cerrada correctamente."},
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def usuario_actual(request):
    return Response(UsuarioSerializer(request.user).data)


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("-date_joined")
    permission_classes = [IsAdminUser]

    def get_serializer_class(self):
        if self.action == "create":
            return CrearUsuarioSerializer
        return UsuarioSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        buscar = self.request.query_params.get("buscar")
        activo = self.request.query_params.get("activo")

        if buscar:
            queryset = queryset.filter(
                Q(username__icontains=buscar)
                | Q(email__icontains=buscar)
                | Q(first_name__icontains=buscar)
                | Q(last_name__icontains=buscar)
            )

        if activo in ["true", "false"]:
            queryset = queryset.filter(is_active=(activo == "true"))

        return queryset.distinct()

    @action(detail=True, methods=["patch"])
    def activar(self, request, pk=None):
        usuario = self.get_object()
        usuario.is_active = True
        usuario.save()

        return Response(
            {
                "mensaje": "Usuario activado correctamente.",
                "usuario": UsuarioSerializer(usuario).data,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["patch"])
    def desactivar(self, request, pk=None):
        usuario = self.get_object()

        if usuario.is_superuser:
            return Response(
                {"error": "No se puede desactivar el administrador principal."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        usuario.is_active = False
        usuario.save()

        return Response(
            {
                "mensaje": "Usuario desactivado correctamente.",
                "usuario": UsuarioSerializer(usuario).data,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"])
    def resumen(self, request):
        total = User.objects.count()
        activos = User.objects.filter(is_active=True).count()
        administradores = User.objects.filter(is_staff=True).count()
        operadores = User.objects.filter(groups__name="Operador").count()

        return Response(
            {
                "total_usuarios": total,
                "usuarios_activos": activos,
                "administradores": administradores,
                "operadores": operadores,
            },
            status=status.HTTP_200_OK,
        )


class RolViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all().order_by("name")
    serializer_class = RolSerializer
    permission_classes = [IsAdminUser]
