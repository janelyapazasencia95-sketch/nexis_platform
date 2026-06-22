from django.urls import path
from .views import (
    resumen_reportes,
    reporte_compras,
    reporte_inventario,
    reporte_pagos,
    compras_por_region,
    exportar_compras_excel,
)

urlpatterns = [
    path("resumen/", resumen_reportes),
    path("compras/", reporte_compras),
    path("inventario/", reporte_inventario),
    path("pagos/", reporte_pagos),
    path("compras-por-region/", compras_por_region),
    path("exportar-compras-excel/", exportar_compras_excel),
]