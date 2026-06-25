from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from zonas.models import Region
from zonas.serializers import RegionSerializer

from .models import ConfiguracionSistema, CalidadFibra, EstadoProcesamiento
from .serializers import (
    ConfiguracionSistemaSerializer,
    CalidadFibraSerializer,
    EstadoProcesamientoSerializer,
)


@api_view(["GET"])
def configuracion_actual(request):
    configuracion, created = ConfiguracionSistema.objects.get_or_create(id=1)
    serializer = ConfiguracionSistemaSerializer(configuracion)
    return Response(serializer.data)


@api_view(["PUT", "PATCH"])
def actualizar_configuracion(request):
    configuracion, created = ConfiguracionSistema.objects.get_or_create(id=1)
    serializer = ConfiguracionSistemaSerializer(
        configuracion,
        data=request.data,
        partial=True
    )

    if serializer.is_valid():
        serializer.save()
        return Response({
            "mensaje": "Configuración actualizada correctamente.",
            "configuracion": serializer.data
        })

    return Response(serializer.errors, status=400)


class CalidadFibraViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = CalidadFibra.objects.all()
    serializer_class = CalidadFibraSerializer


class EstadoProcesamientoViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = EstadoProcesamiento.objects.all()
    serializer_class = EstadoProcesamientoSerializer


@api_view(["GET"])
def regiones_activas(request):
    regiones = Region.objects.filter(activo=True)
    serializer = RegionSerializer(regiones, many=True)
    return Response(serializer.data)
# ============================================================
# SEGURIDAD DE CONFIGURACIÓN - NEXIS
# Solo administradores pueden modificar configuración del sistema.
# ============================================================

from rest_framework.permissions import IsAdminUser

for _name, _obj in list(globals().items()):
    if _name.endswith("ViewSet"):
        _obj.permission_classes = [IsAdminUser]


# === NEXIS CONFIGURACION ADMIN SECURITY ===
# Solo administradores pueden gestionar configuración.
from rest_framework.permissions import IsAdminUser

for _name, _obj in list(globals().items()):
    if _name.endswith("ViewSet"):
        _obj.permission_classes = [IsAdminUser]
# === END NEXIS CONFIGURACION ADMIN SECURITY ===
