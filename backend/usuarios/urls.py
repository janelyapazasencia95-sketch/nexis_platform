from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import login_view, me_view, UsuarioViewSet, RolViewSet

router = DefaultRouter()
router.register(r"usuarios", UsuarioViewSet, basename="usuarios")
router.register(r"roles", RolViewSet, basename="roles")

urlpatterns = [
    path("login/", login_view, name="login"),
    path("me/", me_view, name="me"),
    path("", include(router.urls)),
]
