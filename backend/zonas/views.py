from rest_framework import viewsets
from .models import Region, Provincia, Comunidad
from .serializers import RegionSerializer, ProvinciaSerializer, ComunidadSerializer


class RegionViewSet(viewsets.ModelViewSet):
    queryset = Region.objects.all()
    serializer_class = RegionSerializer


class ProvinciaViewSet(viewsets.ModelViewSet):
    queryset = Provincia.objects.select_related("region").all()
    serializer_class = ProvinciaSerializer


class ComunidadViewSet(viewsets.ModelViewSet):
    queryset = Comunidad.objects.select_related("provincia", "provincia__region").all()
    serializer_class = ComunidadSerializer