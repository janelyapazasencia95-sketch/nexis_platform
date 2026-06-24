from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from .models import Proveedor
from .serializers import ProveedorSerializer


class ProveedorViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Proveedor.objects.select_related(
        "region",
        "provincia",
        "comunidad"
    ).all()
    serializer_class = ProveedorSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        buscar = self.request.query_params.get("buscar")
        region = self.request.query_params.get("region")
        activo = self.request.query_params.get("activo")

        if buscar:
            queryset = queryset.filter(nombre__icontains=buscar)

        if region:
            queryset = queryset.filter(region_id=region)

        if activo in ["true", "false"]:
            queryset = queryset.filter(activo=(activo == "true"))

        return queryset