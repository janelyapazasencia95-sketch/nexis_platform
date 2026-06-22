from django.contrib import admin
from django.db.models import Sum

from .models import Pago


@admin.register(Pago)
class PagoAdmin(admin.ModelAdmin):
    list_display = (
        "codigo",
        "compra",
        "proveedor",
        "fecha_pago",
        "monto",
        "metodo",
        "estado",
        "saldo_pendiente",
    )

    search_fields = (
        "codigo",
        "compra__codigo",
        "compra__proveedor__nombre",
        "operacion",
    )

    list_filter = (
        "metodo",
        "estado",
        "fecha_pago",
    )

    readonly_fields = (
        "codigo",
        "fecha_registro",
    )

    def proveedor(self, obj):
        return obj.compra.proveedor.nombre

    def saldo_pendiente(self, obj):
        total_pagado = Pago.objects.filter(
            compra=obj.compra,
            estado="PROCESADO"
        ).aggregate(total=Sum("monto"))["total"] or 0

        saldo = obj.compra.total - total_pagado
        return f"S/ {saldo:.2f}"