from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Compra
from .serializers import CompraSerializer


class CompraViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Compra.objects.select_related("proveedor", "region").all()
    serializer_class = CompraSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        buscar = self.request.query_params.get("buscar")
        estado = self.request.query_params.get("estado")
        region = self.request.query_params.get("region")
        proveedor = self.request.query_params.get("proveedor")

        if buscar:
            queryset = queryset.filter(codigo__icontains=buscar) | queryset.filter(proveedor__nombre__icontains=buscar)

        if estado:
            queryset = queryset.filter(estado=estado)

        if region:
            queryset = queryset.filter(region_id=region)

        if proveedor:
            queryset = queryset.filter(proveedor_id=proveedor)

        return queryset

    @action(detail=True, methods=["post"])
    def confirmar(self, request, pk=None):
        compra = self.get_object()

        if compra.estado == "ANULADA":
            return Response(
                {"error": "No se puede confirmar una compra anulada."},
                status=status.HTTP_400_BAD_REQUEST
            )

        compra.estado = "CONFIRMADA"
        compra.save()

        return Response({
            "mensaje": "Compra confirmada correctamente.",
            "compra": CompraSerializer(compra).data
        })

    @action(detail=True, methods=["post"])
    def anular(self, request, pk=None):
        compra = self.get_object()

        if compra.estado == "CONFIRMADA" and compra.pagos.exists():
            return Response(
                {"error": "No se puede anular una compra con pagos registrados."},
                status=status.HTTP_400_BAD_REQUEST
            )

        compra.estado = "ANULADA"
        compra.save()

        return Response({
            "mensaje": "Compra anulada correctamente.",
            "compra": CompraSerializer(compra).data
        })

    @action(detail=False, methods=["get"])
    def resumen(self, request):
        data = Compra.objects.aggregate(
            total_compras=Count("id"),
            total_kg=Sum("kilogramos"),
            total_monto=Sum("total"),
        )

        pendientes = Compra.objects.filter(estado="BORRADOR").count()

        return Response({
            "total_compras": data["total_compras"] or 0,
            "total_kg": data["total_kg"] or 0,
            "total_monto": data["total_monto"] or 0,
            "pendientes": pendientes,
        })