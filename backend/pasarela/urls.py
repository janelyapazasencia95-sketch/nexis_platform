from django.urls import path

from .views import crear_sesion_stripe, confirmar_sesion_stripe

urlpatterns = [
    path("stripe/crear-sesion/", crear_sesion_stripe, name="crear_sesion_stripe"),
    path("stripe/confirmar-sesion/", confirmar_sesion_stripe, name="confirmar_sesion_stripe"),
]
