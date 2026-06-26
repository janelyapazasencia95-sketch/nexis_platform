from decimal import Decimal

from django.db.models import Sum, Count
from rest_framework.decorators import api_view
from rest_framework.response import Response

from proveedores.models import Proveedor
from compras.models import Compra
from inventario.models import LoteInventario
from pagos.models import Pago
from configuracion.models import ConfiguracionSistema


def obtener_configuracion():
    return ConfiguracionSistema.objects.order_by("id").first()


@api_view(["GET"])
def resumen_dashboard(request):
    total_comprado = Compra.objects.filter(
        estado="CONFIRMADA"
    ).aggregate(total=Sum("kilogramos"))["total"] or 0

    total_pagado = Pago.objects.filter(
        estado="PROCESADO"
    ).aggregate(total=Sum("monto"))["total"] or 0

    total_compras = Compra.objects.filter(
        estado="CONFIRMADA"
    ).aggregate(total=Sum("total"))["total"] or 0

    deuda_pendiente = total_compras - total_pagado

    stock_disponible = LoteInventario.objects.filter(
        estado__in=["DISPONIBLE", "RESERVADO"]
    ).aggregate(total=Sum("kg_actual"))["total"] or 0

    proveedores_activos = Proveedor.objects.filter(
        activo=True
    ).count()

    compras_pendientes = Compra.objects.filter(
        estado="BORRADOR"
    ).count()

    compras_recientes = Compra.objects.select_related(
        "proveedor",
        "region",
        "calidad_fibra",
        "estado_procesamiento",
    ).order_by("-fecha_compra")[:5]

    compras_recientes_data = []

    for compra in compras_recientes:
        compras_recientes_data.append({
            "codigo": compra.codigo,
            "fecha_compra": compra.fecha_compra,
            "proveedor": compra.proveedor.nombre,
            "region": compra.region.nombre,
            "kilogramos": compra.kilogramos,
            "total": compra.total,
            "estado": compra.estado,
            "calidad": compra.calidad_fibra.nombre if compra.calidad_fibra else compra.get_calidad_display(),
            "estado_procesamiento": compra.estado_procesamiento.nombre if compra.estado_procesamiento else None,
        })

    return Response({
        "total_comprado_kg": total_comprado,
        "total_pagado": total_pagado,
        "total_compras": total_compras,
        "deuda_pendiente": deuda_pendiente,
        "stock_disponible_kg": stock_disponible,
        "proveedores_activos": proveedores_activos,
        "compras_pendientes": compras_pendientes,
        "compras_recientes": compras_recientes_data,
    })


@api_view(["GET"])
def compras_por_region(request):
    data = Compra.objects.filter(
        estado="CONFIRMADA"
    ).values(
        "region__nombre"
    ).annotate(
        total_kg=Sum("kilogramos"),
        total_monto=Sum("total"),
        cantidad=Count("id")
    ).order_by("-total_kg")

    resultado = []

    for item in data:
        resultado.append({
            "region": item["region__nombre"],
            "total_kg": item["total_kg"],
            "total_monto": item["total_monto"],
            "cantidad": item["cantidad"],
        })

    return Response(resultado)


@api_view(["GET"])
def pagos_por_estado(request):
    total_compras = Compra.objects.filter(
        estado="CONFIRMADA"
    ).aggregate(total=Sum("total"))["total"] or 0

    total_pagado = Pago.objects.filter(
        estado="PROCESADO"
    ).aggregate(total=Sum("monto"))["total"] or 0

    pendiente = total_compras - total_pagado

    return Response({
        "total_compras": total_compras,
        "pagado": total_pagado,
        "pendiente": pendiente,
    })


@api_view(["GET"])
def alertas_stock(request):
    configuracion = obtener_configuracion()

    if configuracion:
        umbral_stock_bajo = configuracion.umbral_stock_bajo

        if not configuracion.alerta_stock_activa:
            return Response([])
    else:
        umbral_stock_bajo = Decimal("50.00")

    lotes_bajos = LoteInventario.objects.filter(
        kg_actual__lte=umbral_stock_bajo,
        estado="DISPONIBLE"
    ).select_related("region", "compra")

    resultado = []

    for lote in lotes_bajos:
        resultado.append({
            "codigo": lote.codigo,
            "region": lote.region.nombre,
            "calidad": lote.calidad,
            "kg_actual": lote.kg_actual,
            "ubicacion": lote.ubicacion,
            "estado": lote.estado,
            "umbral_stock_bajo": umbral_stock_bajo,
        })

    return Response(resultado)
