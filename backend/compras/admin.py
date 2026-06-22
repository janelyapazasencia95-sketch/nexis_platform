from django.contrib import admin
from .models import Compra


@admin.register(Compra)
class CompraAdmin(admin.ModelAdmin):
    list_display = (
        "codigo",
        "fecha_compra",
        "proveedor",
        "region",
        "kilogramos",
        "precio_kg",
        "total",
        "calidad",
        "estado",
    )

    search_fields = (
        "codigo",
        "proveedor__nombre",
        "region__nombre",
    )

    list_filter = (
        "estado",
        "calidad",
        "region",
        "fecha_compra",
    )

    readonly_fields = (
        "codigo",
        "total",
        "fecha_registro",
        "fecha_actualizacion",
    )