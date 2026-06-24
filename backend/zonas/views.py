from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from .models import Region, Provincia, Comunidad
from .serializers import RegionSerializer, ProvinciaSerializer, ComunidadSerializer


class RegionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Region.objects.all()
    serializer_class = RegionSerializer


class ProvinciaViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Provincia.objects.select_related("region").all()
    serializer_class = ProvinciaSerializer


class ComunidadViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Comunidad.objects.select_related("provincia", "provincia__region").all()
    serializer_class = ComunidadSerializer