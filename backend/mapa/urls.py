from django.urls import path
from .views import (
    resumen_mapa_regiones,
    detalle_region,
    ranking_regiones,
)

urlpatterns = [
    path("regiones/", resumen_mapa_regiones),
    path("regiones/<int:region_id>/", detalle_region),
    path("ranking-regiones/", ranking_regiones),
]