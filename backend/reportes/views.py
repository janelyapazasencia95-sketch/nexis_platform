import csv
from django.http import HttpResponse
from django.db.models import Sum, Count
from rest_framework.decorators import api_view
from rest_framework.response import Response

from compras.models import Compra
from inventario.models import LoteInventario
from pagos.models import Pago


@api_view(["GET"])
def resumen_reportes(request):
    total_fibra = Compra.objects.filter(
        estado="CONFIRMADA"
    ).aggregate(total=Sum("kilogramos"))["total"] or 0

    valor_total = Compra.objects.filter(
        estado="CONFIRMADA"
    ).aggregate(total=Sum("total"))["total"] or 0

    total_pagado = Pago.objects.filter(
        estado="PROCESADO"
    ).aggregate(total=Sum("monto"))["total"] or 0

    stock_total = LoteInventario.objects.aggregate(
        total=Sum("kg_actual")
    )["total"] or 0

    compras_confirmadas = Compra.objects.filter(estado="CONFIRMADA").count()
    compras_borrador = Compra.objects.filter(estado="BORRADOR").count()
    compras_anuladas = Compra.objects.filter(estado="ANULADA").count()

    return Response({
        "total_fibra_kg": total_fibra,
        "valor_total": valor_total,
        "total_pagado": total_pagado,
        "deuda_pendiente": valor_total - total_pagado,
        "stock_total_kg": stock_total,
        "compras_confirmadas": compras_confirmadas,
        "compras_borrador": compras_borrador,
        "compras_anuladas": compras_anuladas,
    })


@api_view(["GET"])
def reporte_compras(request):
    compras = Compra.objects.select_related(
        "proveedor",
        "region"
    ).all()

    fecha_inicio = request.GET.get("fecha_inicio")
    fecha_fin = request.GET.get("fecha_fin")
    region = request.GET.get("region")
    proveedor = request.GET.get("proveedor")
    estado = request.GET.get("estado")
    calidad = request.GET.get("calidad")

    if fecha_inicio:
        compras = compras.filter(fecha_compra__gte=fecha_inicio)

    if fecha_fin:
        compras = compras.filter(fecha_compra__lte=fecha_fin)

    if region:
        compras = compras.filter(region_id=region)

    if proveedor:
        compras = compras.filter(proveedor_id=proveedor)

    if estado:
        compras = compras.filter(estado=estado)

    if calidad:
        compras = compras.filter(calidad=calidad)

    resultado = []

    for compra in compras:
        resultado.append({
            "codigo": compra.codigo,
            "fecha_compra": compra.fecha_compra,
            "proveedor": compra.proveedor.nombre,
            "region": compra.region.nombre,
            "kilogramos": compra.kilogramos,
            "precio_kg": compra.precio_kg,
            "total": compra.total,
            "calidad": compra.get_calidad_display(),
            "estado": compra.get_estado_display(),
        })

    return Response(resultado)


@api_view(["GET"])
def reporte_inventario(request):
    lotes = LoteInventario.objects.select_related(
        "compra",
        "compra__proveedor",
        "region"
    ).all()

    resultado = []

    for lote in lotes:
        resultado.append({
            "codigo": lote.codigo,
            "compra": lote.compra.codigo,
            "proveedor": lote.compra.proveedor.nombre,
            "region": lote.region.nombre,
            "calidad": lote.calidad,
            "kg_inicial": lote.kg_inicial,
            "kg_actual": lote.kg_actual,
            "ubicacion": lote.ubicacion,
            "estado": lote.get_estado_display(),
        })

    return Response(resultado)


@api_view(["GET"])
def reporte_pagos(request):
    pagos = Pago.objects.select_related(
        "compra",
        "compra__proveedor"
    ).all()

    resultado = []

    for pago in pagos:
        resultado.append({
            "codigo": pago.codigo,
            "compra": pago.compra.codigo,
            "proveedor": pago.compra.proveedor.nombre,
            "fecha_pago": pago.fecha_pago,
            "monto": pago.monto,
            "metodo": pago.get_metodo_display(),
            "estado": pago.get_estado_display(),
            "operacion": pago.operacion,
        })

    return Response(resultado)


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


def exportar_compras_excel(request):
    compras = Compra.objects.select_related(
        "proveedor",
        "region"
    ).all()

    response = HttpResponse(content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = 'attachment; filename="reporte_compras_nexis.csv"'

    writer = csv.writer(response)
    writer.writerow([
        "Código",
        "Fecha",
        "Proveedor",
        "Región",
        "Kg",
        "Precio por kg",
        "Total",
        "Calidad",
        "Estado",
    ])

    for compra in compras:
        writer.writerow([
            compra.codigo,
            compra.fecha_compra,
            compra.proveedor.nombre,
            compra.region.nombre,
            compra.kilogramos,
            compra.precio_kg,
            compra.total,
            compra.get_calidad_display(),
            compra.get_estado_display(),
        ])

    return response