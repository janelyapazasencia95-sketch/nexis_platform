from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import LoteInventario, MovimientoInventario
from .serializers import LoteInventarioSerializer, MovimientoInventarioSerializer


class LoteInventarioViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = LoteInventario.objects.select_related(
        "compra",
        "compra__proveedor",
        "region"
    ).all()
    serializer_class = LoteInventarioSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        buscar = self.request.query_params.get("buscar")
        estado = self.request.query_params.get("estado")
        region = self.request.query_params.get("region")

        if buscar:
            queryset = queryset.filter(codigo__icontains=buscar)

        if estado:
            queryset = queryset.filter(estado=estado)

        if region:
            queryset = queryset.filter(region_id=region)

        return queryset

    @action(detail=False, methods=["get"])
    def resumen(self, request):
        data = LoteInventario.objects.aggregate(
            stock_total=Sum("kg_actual"),
            total_lotes=Count("id")
        )

        agotados = LoteInventario.objects.filter(estado="AGOTADO").count()
        reservados = LoteInventario.objects.filter(estado="RESERVADO").count()

        return Response({
            "stock_total": data["stock_total"] or 0,
            "total_lotes": data["total_lotes"] or 0,
            "lotes_agotados": agotados,
            "lotes_reservados": reservados,
        })


class MovimientoInventarioViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = MovimientoInventario.objects.select_related("lote").all()
    serializer_class = MovimientoInventarioSerializer