from django.urls import path

from .views import (
    resumen_reportes,
    reporte_compras,
    reporte_inventario,
    reporte_pagos,
    compras_por_region,
    exportar_compras_excel,
    exportar_compras_pdf,
    exportar_proveedores_pdf,
    exportar_inventario_pdf,
    exportar_pagos_pdf,
    exportar_mapa_pdf,
)

urlpatterns = [
    path("resumen/", resumen_reportes),
    path("compras/", reporte_compras),
    path("inventario/", reporte_inventario),
    path("pagos/", reporte_pagos),
    path("compras-por-region/", compras_por_region),
    path("exportar-compras-excel/", exportar_compras_excel),

    path("exportar-compras-pdf/", exportar_compras_pdf),
    path("exportar-proveedores-pdf/", exportar_proveedores_pdf),
    path("exportar-inventario-pdf/", exportar_inventario_pdf),
    path("exportar-pagos-pdf/", exportar_pagos_pdf),
    path("exportar-mapa-pdf/", exportar_mapa_pdf),
]