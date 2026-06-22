from django.urls import path
from .views import (
    resumen_dashboard,
    compras_por_region,
    pagos_por_estado,
    alertas_stock,
)

urlpatterns = [
    path("resumen/", resumen_dashboard),
    path("compras-por-region/", compras_por_region),
    path("pagos-por-estado/", pagos_por_estado),
    path("alertas-stock/", alertas_stock),
]