from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    login_usuario,
    logout_usuario,
    usuario_actual,
    UsuarioViewSet,
    RolViewSet,
)

router = DefaultRouter()
router.register(r"usuarios", UsuarioViewSet, basename="usuarios")
router.register(r"roles", RolViewSet, basename="roles")

urlpatterns = [
    path("login/", login_usuario, name="login"),
    path("logout/", logout_usuario, name="logout"),
    path("me/", usuario_actual, name="usuario_actual"),
    path("", include(router.urls)),
]
