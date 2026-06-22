from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    configuracion_actual,
    actualizar_configuracion,
    CalidadFibraViewSet,
    EstadoProcesamientoViewSet,
    regiones_activas,
)

router = DefaultRouter()
router.register(r"calidades", CalidadFibraViewSet, basename="calidades")
router.register(r"estados", EstadoProcesamientoViewSet, basename="estados")

urlpatterns = [
    path("actual/", configuracion_actual),
    path("actualizar/", actualizar_configuracion),
    path("regiones-activas/", regiones_activas),
    path("", include(router.urls)),
]