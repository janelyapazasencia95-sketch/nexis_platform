from decimal import Decimal

from django.db.models import Sum
from rest_framework.decorators import api_view
from rest_framework.response import Response

from zonas.models import Region
from proveedores.models import Proveedor
from compras.models import Compra
from inventario.models import LoteInventario
from pagos.models import Pago


COORDENADAS_REGIONES = {
    "puno": {"lat": -15.8402, "lng": -70.0219},
    "cusco": {"lat": -13.5319, "lng": -71.9675},
    "ayacucho": {"lat": -13.1631, "lng": -74.2236},
    "arequipa": {"lat": -16.4090, "lng": -71.5375},
    "apurímac": {"lat": -13.6339, "lng": -72.8819},
    "apurimac": {"lat": -13.6339, "lng": -72.8819},
    "huancavelica": {"lat": -12.7862, "lng": -74.9764},
}


def obtener_coordenadas(nombre_region):
    nombre = nombre_region.lower().strip()
    return COORDENADAS_REGIONES.get(nombre, {"lat": -9.1900, "lng": -75.0152})


def calcular_estado_region(total_kg):
    if total_kg >= 300:
        return "Alta actividad"
    if total_kg >= 100:
        return "Actividad media"
    if total_kg > 0:
        return "Actividad baja"
    return "Sin actividad"


@api_view(["GET"])
def resumen_mapa_regiones(request):
    regiones = Region.objects.filter(activo=True).order_by("nombre")
    resultado = []

    for region in regiones:
        compras = Compra.objects.filter(
            region=region,
            estado="CONFIRMADA"
        )

        total_kg = compras.aggregate(
            total=Sum("kilogramos")
        )["total"] or Decimal("0.00")

        total_compras = compras.aggregate(
            total=Sum("total")
        )["total"] or Decimal("0.00")

        total_pagado = Pago.objects.filter(
            compra__region=region,
            estado="PROCESADO"
        ).aggregate(
            total=Sum("monto")
        )["total"] or Decimal("0.00")

        stock = LoteInventario.objects.filter(
            region=region
        ).aggregate(
            total=Sum("kg_actual")
        )["total"] or Decimal("0.00")

        proveedores_activos = Proveedor.objects.filter(
            region=region,
            activo=True
        ).count()

        coordenadas = obtener_coordenadas(region.nombre)

        resultado.append({
            "id": region.id,
            "nombre": region.nombre,
            "codigo": region.codigo,
            "lat": coordenadas["lat"],
            "lng": coordenadas["lng"],
            "proveedores_activos": proveedores_activos,
            "total_kg_comprado": total_kg,
            "valor_total_compras": total_compras,
            "total_pagado": total_pagado,
            "deuda_pendiente": total_compras - total_pagado,
            "stock_disponible_kg": stock,
            "estado_region": calcular_estado_region(total_kg),
        })

    return Response(resultado)


@api_view(["GET"])
def detalle_region(request, region_id):
    try:
        region = Region.objects.get(id=region_id)
    except Region.DoesNotExist:
        return Response(
            {"error": "La región no existe."},
            status=404
        )

    compras = Compra.objects.filter(
        region=region
    ).select_related("proveedor").order_by("-fecha_compra")

    proveedores = Proveedor.objects.filter(
        region=region,
        activo=True
    )

    lotes = LoteInventario.objects.filter(
        region=region
    )

    pagos = Pago.objects.filter(
        compra__region=region,
        estado="PROCESADO"
    )

    total_kg = compras.filter(
        estado="CONFIRMADA"
    ).aggregate(
        total=Sum("kilogramos")
    )["total"] or Decimal("0.00")

    total_compras = compras.filter(
        estado="CONFIRMADA"
    ).aggregate(
        total=Sum("total")
    )["total"] or Decimal("0.00")

    total_pagado = pagos.aggregate(
        total=Sum("monto")
    )["total"] or Decimal("0.00")

    stock = lotes.aggregate(
        total=Sum("kg_actual")
    )["total"] or Decimal("0.00")

    compras_recientes = []

    for compra in compras[:5]:
        compras_recientes.append({
            "codigo": compra.codigo,
            "fecha_compra": compra.fecha_compra,
            "proveedor": compra.proveedor.nombre,
            "kilogramos": compra.kilogramos,
            "total": compra.total,
            "estado": compra.get_estado_display(),
            "calidad": compra.get_calidad_display(),
        })

    return Response({
        "region": {
            "id": region.id,
            "nombre": region.nombre,
            "codigo": region.codigo,
        },
        "resumen": {
            "proveedores_activos": proveedores.count(),
            "total_kg_comprado": total_kg,
            "valor_total_compras": total_compras,
            "total_pagado": total_pagado,
            "deuda_pendiente": total_compras - total_pagado,
            "stock_disponible_kg": stock,
            "cantidad_lotes": lotes.count(),
        },
        "compras_recientes": compras_recientes,
    })


@api_view(["GET"])
def ranking_regiones(request):
    regiones = Region.objects.filter(activo=True)
    resultado = []

    for region in regiones:
        total_kg = Compra.objects.filter(
            region=region,
            estado="CONFIRMADA"
        ).aggregate(
            total=Sum("kilogramos")
        )["total"] or Decimal("0.00")

        resultado.append({
            "region": region.nombre,
            "codigo": region.codigo,
            "total_kg": total_kg,
        })

    resultado = sorted(
        resultado,
        key=lambda item: item["total_kg"],
        reverse=True
    )

    return Response(resultado)