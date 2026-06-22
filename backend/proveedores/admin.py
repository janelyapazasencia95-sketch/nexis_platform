from django.contrib import admin
from .models import Proveedor


@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = (
        "nombre",
        "tipo_proveedor",
        "tipo_documento",
        "numero_documento",
        "region",
        "telefono",
        "activo",
    )
    search_fields = (
        "nombre",
        "numero_documento",
        "telefono",
        "correo",
    )
    list_filter = (
        "tipo_proveedor",
        "tipo_documento",
        "region",
        "activo",
    )