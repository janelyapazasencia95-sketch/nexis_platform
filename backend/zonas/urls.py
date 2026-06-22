from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegionViewSet, ProvinciaViewSet, ComunidadViewSet

router = DefaultRouter()
router.register(r"regiones", RegionViewSet)
router.register(r"provincias", ProvinciaViewSet)
router.register(r"comunidades", ComunidadViewSet)

urlpatterns = [
    path("", include(router.urls)),
]