from django.contrib import admin
from .models import Region, Provincia, Comunidad


@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    list_display = ("nombre", "codigo", "activo")
    search_fields = ("nombre", "codigo")
    list_filter = ("activo",)


@admin.register(Provincia)
class ProvinciaAdmin(admin.ModelAdmin):
    list_display = ("nombre", "region", "activo")
    search_fields = ("nombre", "region__nombre")
    list_filter = ("region", "activo")


@admin.register(Comunidad)
class ComunidadAdmin(admin.ModelAdmin):
    list_display = ("nombre", "provincia", "activo")
    search_fields = ("nombre", "provincia__nombre")
    list_filter = ("provincia__region", "activo")