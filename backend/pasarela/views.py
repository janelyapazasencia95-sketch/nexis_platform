from decimal import Decimal, ROUND_HALF_UP

import stripe
from django.conf import settings
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from compras.models import Compra
from pagos.models import Pago


def convertir_a_centimos(valor):
    monto = Decimal(valor or 0).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return int(monto * 100)


def obtener_saldo_compra(compra):
    total_pagado = (
        Pago.objects.filter(compra=compra, estado="PROCESADO")
        .aggregate(total=Sum("monto"))["total"]
        or Decimal("0.00")
    )

    return Decimal(compra.total or 0) - Decimal(total_pagado or 0)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def crear_sesion_stripe(request):
    if not settings.STRIPE_SECRET_KEY:
        return Response(
            {"error": "STRIPE_SECRET_KEY no está configurada en el servidor."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    compra_id = request.data.get("compra_id")

    if not compra_id:
        return Response(
            {"error": "El campo compra_id es obligatorio."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        compra = Compra.objects.select_related("proveedor", "region").get(id=compra_id)
    except Compra.DoesNotExist:
        return Response(
            {"error": "La compra seleccionada no existe."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if compra.estado != "CONFIRMADA":
        return Response(
            {"error": "Solo se pueden pagar compras confirmadas."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    saldo = obtener_saldo_compra(compra)

    if saldo <= 0:
        return Response(
            {"error": "La compra no tiene saldo pendiente."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    stripe.api_key = settings.STRIPE_SECRET_KEY

    try:
        sesion = stripe.checkout.Session.create(
            mode="payment",
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": settings.STRIPE_CURRENCY,
                        "product_data": {
                            "name": f"Pago compra {compra.codigo}",
                            "description": f"Proveedor: {compra.proveedor.nombre}",
                        },
                        "unit_amount": convertir_a_centimos(saldo),
                    },
                    "quantity": 1,
                }
            ],
            success_url=settings.STRIPE_SUCCESS_URL,
            cancel_url=settings.STRIPE_CANCEL_URL,
            client_reference_id=str(compra.id),
            metadata={
                "sistema": "NEXIS",
                "compra_id": str(compra.id),
                "compra_codigo": compra.codigo,
            },
        )

        return Response(
            {
                "checkout_url": sesion.url,
                "session_id": sesion.id,
                "compra_id": compra.id,
                "saldo": str(saldo),
                "moneda": settings.STRIPE_CURRENCY.upper(),
            }
        )

    except stripe.error.StripeError as error:
        return Response(
            {"error": f"Error de Stripe: {str(error)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def confirmar_sesion_stripe(request):
    session_id = request.data.get("session_id")

    if not session_id:
        return Response(
            {"error": "El campo session_id es obligatorio."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    stripe.api_key = settings.STRIPE_SECRET_KEY

    try:
        sesion = stripe.checkout.Session.retrieve(session_id)
    except stripe.error.StripeError as error:
        return Response(
            {"error": f"No se pudo consultar Stripe: {str(error)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if sesion.payment_status != "paid":
        return Response(
            {
                "estado": sesion.payment_status,
                "mensaje": "El pago todavía no figura como pagado en Stripe.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    compra_id = sesion.metadata.get("compra_id") or sesion.client_reference_id

    try:
        compra = Compra.objects.get(id=compra_id)
    except Compra.DoesNotExist:
        return Response(
            {"error": "La compra asociada al pago no existe."},
            status=status.HTTP_404_NOT_FOUND,
        )

    monto = Decimal(sesion.amount_total or 0) / Decimal("100")

    with transaction.atomic():
        pago_existente = Pago.objects.filter(operacion=sesion.id).first()

        if pago_existente:
            return Response(
                {
                    "mensaje": "El pago ya estaba registrado en NEXIS.",
                    "pago_id": pago_existente.id,
                    "codigo": pago_existente.codigo,
                }
            )

        pago = Pago.objects.create(
            compra=compra,
            fecha_pago=timezone.localdate(),
            monto=monto,
            metodo="TARJETA_SIMULADA",
            estado="PROCESADO",
            operacion=sesion.id,
            observacion=f"Pago procesado con Stripe Test. PaymentIntent: {sesion.payment_intent}",
        )

    return Response(
        {
            "mensaje": "Pago Stripe confirmado y registrado en NEXIS.",
            "pago_id": pago.id,
            "codigo": pago.codigo,
            "monto": str(pago.monto),
        }
    )
