from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LoteInventarioViewSet, MovimientoInventarioViewSet

router = DefaultRouter()
router.register(r"lotes", LoteInventarioViewSet, basename="lotes")
router.register(r"movimientos", MovimientoInventarioViewSet, basename="movimientos")

urlpatterns = [
    path("", include(router.urls)),
]