import csv
from django.http import HttpResponse
from django.db.models import Sum, Count
from proveedores.models import Proveedor
from .pdf_utils import generar_pdf_tabla
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


def exportar_compras_pdf(request):
    compras = Compra.objects.select_related(
        "proveedor",
        "region"
    ).order_by("-fecha_compra")

    encabezados = [
        "Código",
        "Fecha",
        "Proveedor",
        "Región",
        "Kg",
        "Precio/kg",
        "Total",
        "Calidad",
        "Estado",
    ]

    filas = []

    for compra in compras:
        filas.append([
            compra.codigo,
            compra.fecha_compra.strftime("%d/%m/%Y"),
            compra.proveedor.nombre,
            compra.region.nombre,
            f"{compra.kilogramos} kg",
            f"S/ {compra.precio_kg}",
            f"S/ {compra.total}",
            compra.get_calidad_display(),
            compra.get_estado_display(),
        ])

    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = 'attachment; filename="reporte_compras_nexis.pdf"'

    return generar_pdf_tabla(
        response=response,
        titulo="Reporte de Compras",
        subtitulo="Listado formal de compras registradas de fibra de vicuña",
        encabezados=encabezados,
        filas=filas,
    )


def exportar_proveedores_pdf(request):
    proveedores = Proveedor.objects.select_related(
        "region",
        "provincia",
        "comunidad"
    ).order_by("nombre")

    encabezados = [
        "Proveedor",
        "Tipo",
        "Documento",
        "Región",
        "Provincia",
        "Comunidad",
        "Teléfono",
        "Correo",
        "Estado",
    ]

    filas = []

    for proveedor in proveedores:
        filas.append([
            proveedor.nombre,
            proveedor.get_tipo_proveedor_display(),
            f"{proveedor.tipo_documento} {proveedor.numero_documento}",
            proveedor.region.nombre if proveedor.region else "-",
            proveedor.provincia.nombre if proveedor.provincia else "-",
            proveedor.comunidad.nombre if proveedor.comunidad else "-",
            proveedor.telefono or "-",
            proveedor.correo or "-",
            "Activo" if proveedor.activo else "Inactivo",
        ])

    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = 'attachment; filename="reporte_proveedores_nexis.pdf"'

    return generar_pdf_tabla(
        response=response,
        titulo="Reporte de Proveedores",
        subtitulo="Directorio formal de proveedores, comunidades y asociaciones",
        encabezados=encabezados,
        filas=filas,
    )


def exportar_inventario_pdf(request):
    lotes = LoteInventario.objects.select_related(
        "compra",
        "compra__proveedor",
        "region"
    ).order_by("-fecha_creacion")

    encabezados = [
        "Lote",
        "Compra",
        "Proveedor",
        "Región",
        "Calidad",
        "Kg inicial",
        "Kg actual",
        "Ubicación",
        "Estado",
    ]

    filas = []

    for lote in lotes:
        filas.append([
            lote.codigo,
            lote.compra.codigo,
            lote.compra.proveedor.nombre,
            lote.region.nombre,
            lote.calidad,
            f"{lote.kg_inicial} kg",
            f"{lote.kg_actual} kg",
            lote.ubicacion,
            lote.get_estado_display(),
        ])

    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = 'attachment; filename="reporte_inventario_nexis.pdf"'

    return generar_pdf_tabla(
        response=response,
        titulo="Reporte de Inventario",
        subtitulo="Control formal de lotes, stock disponible y ubicación",
        encabezados=encabezados,
        filas=filas,
    )


def exportar_pagos_pdf(request):
    pagos = Pago.objects.select_related(
        "compra",
        "compra__proveedor"
    ).order_by("-fecha_pago")

    encabezados = [
        "Código",
        "Compra",
        "Proveedor",
        "Fecha pago",
        "Monto",
        "Método",
        "Estado",
        "Operación",
    ]

    filas = []

    for pago in pagos:
        filas.append([
            pago.codigo,
            pago.compra.codigo,
            pago.compra.proveedor.nombre,
            pago.fecha_pago.strftime("%d/%m/%Y"),
            f"S/ {pago.monto}",
            pago.get_metodo_display(),
            pago.get_estado_display(),
            pago.operacion or "-",
        ])

    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = 'attachment; filename="reporte_pagos_nexis.pdf"'

    return generar_pdf_tabla(
        response=response,
        titulo="Reporte de Pagos",
        subtitulo="Listado formal de pagos procesados y registrados",
        encabezados=encabezados,
        filas=filas,
    )


def exportar_mapa_pdf(request):
    compras = Compra.objects.select_related(
        "proveedor",
        "region"
    ).order_by("region__nombre")

    pagos = Pago.objects.filter(estado="PROCESADO")

    pagos_por_compra = {}
    for pago in pagos:
        compra_id = pago.compra_id
        pagos_por_compra[compra_id] = pagos_por_compra.get(compra_id, 0) + pago.monto

    resumen = {}

    for compra in compras:
        region = compra.region.nombre if compra.region else "Sin región"

        if region not in resumen:
            resumen[region] = {
                "kg": 0,
                "monto": 0,
                "deuda": 0,
                "compras": 0,
                "proveedores": set(),
                "calidades": {},
            }

        pagado = pagos_por_compra.get(compra.id, 0)
        deuda = max(compra.total - pagado, 0)

        resumen[region]["kg"] += compra.kilogramos
        resumen[region]["monto"] += compra.total
        resumen[region]["deuda"] += deuda
        resumen[region]["compras"] += 1
        resumen[region]["proveedores"].add(compra.proveedor_id)

        calidad = compra.get_calidad_display()
        resumen[region]["calidades"][calidad] = (
            resumen[region]["calidades"].get(calidad, 0) + 1
        )

    encabezados = [
        "Región",
        "Kg comprados",
        "Monto total",
        "Deuda pendiente",
        "Proveedores",
        "Compras",
        "Calidad predominante",
    ]

    filas = []

    for region, datos in resumen.items():
        calidad_predominante = "-"

        if datos["calidades"]:
            calidad_predominante = sorted(
                datos["calidades"].items(),
                key=lambda item: item[1],
                reverse=True
            )[0][0]

        filas.append([
            region,
            f"{datos['kg']} kg",
            f"S/ {datos['monto']}",
            f"S/ {datos['deuda']}",
            len(datos["proveedores"]),
            datos["compras"],
            calidad_predominante,
        ])

    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = 'attachment; filename="reporte_mapa_peru_nexis.pdf"'

    return generar_pdf_tabla(
        response=response,
        titulo="Reporte de Mapa Perú",
        subtitulo="Resumen geográfico de compras, proveedores, deuda y calidad por región",
        encabezados=encabezados,
        filas=filas,
    )