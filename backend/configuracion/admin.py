from django.contrib import admin
from .models import ConfiguracionSistema, CalidadFibra, EstadoProcesamiento


@admin.register(ConfiguracionSistema)
class ConfiguracionSistemaAdmin(admin.ModelAdmin):
    list_display = (
        "nombre_empresa",
        "ruc",
        "moneda_base",
        "tipo_cambio",
        "umbral_stock_bajo",
        "alerta_stock_activa",
    )


@admin.register(CalidadFibra)
class CalidadFibraAdmin(admin.ModelAdmin):
    list_display = (
        "nombre",
        "micraje_min",
        "micraje_max",
        "activo",
    )
    search_fields = ("nombre",)
    list_filter = ("activo",)


@admin.register(EstadoProcesamiento)
class EstadoProcesamientoAdmin(admin.ModelAdmin):
    list_display = (
        "nombre",
        "color",
        "activo",
    )
    search_fields = ("nombre",)
    list_filter = ("activo",)