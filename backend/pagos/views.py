from django.db.models import Sum
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from compras.models import Compra
from .models import Pago
from .serializers import PagoSerializer


class PagoViewSet(viewsets.ModelViewSet):
    queryset = Pago.objects.select_related("compra", "compra__proveedor").all()
    serializer_class = PagoSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        buscar = self.request.query_params.get("buscar")
        metodo = self.request.query_params.get("metodo")
        estado = self.request.query_params.get("estado")

        if buscar:
            queryset = queryset.filter(codigo__icontains=buscar) | queryset.filter(compra__codigo__icontains=buscar) | queryset.filter(compra__proveedor__nombre__icontains=buscar)

        if metodo:
            queryset = queryset.filter(metodo=metodo)

        if estado:
            queryset = queryset.filter(estado=estado)

        return queryset

    @action(detail=False, methods=["get"])
    def resumen(self, request):
        total_pagado = Pago.objects.filter(estado="PROCESADO").aggregate(
            total=Sum("monto")
        )["total"] or 0

        total_compras = Compra.objects.filter(estado="CONFIRMADA").aggregate(
            total=Sum("total")
        )["total"] or 0

        deuda = total_compras - total_pagado

        return Response({
            "total_pagado": total_pagado,
            "total_compras": total_compras,
            "deuda_pendiente": deuda,
        })