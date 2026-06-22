from django.contrib import admin
from .models import LoteInventario, MovimientoInventario


@admin.register(LoteInventario)
class LoteInventarioAdmin(admin.ModelAdmin):
    list_display = (
        "codigo",
        "compra",
        "region",
        "calidad",
        "kg_inicial",
        "kg_actual",
        "ubicacion",
        "estado",
        "fecha_creacion",
    )

    search_fields = (
        "codigo",
        "compra__codigo",
        "compra__proveedor__nombre",
        "ubicacion",
    )

    list_filter = (
        "estado",
        "calidad",
        "region",
    )

    readonly_fields = (
        "codigo",
        "fecha_creacion",
    )


@admin.register(MovimientoInventario)
class MovimientoInventarioAdmin(admin.ModelAdmin):
    list_display = (
        "lote",
        "tipo",
        "cantidad_kg",
        "motivo",
        "fecha_movimiento",
    )

    search_fields = (
        "lote__codigo",
        "motivo",
    )

    list_filter = (
        "tipo",
        "fecha_movimiento",
    )