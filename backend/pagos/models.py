from decimal import Decimal
import uuid

from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.db.models import Sum
from django.utils import timezone


class Pago(models.Model):
    METODO_CHOICES = [
        ("EFECTIVO", "Efectivo"),
        ("TRANSFERENCIA", "Transferencia bancaria"),
        ("YAPE", "Yape"),
        ("PLIN", "Plin"),
        ("TARJETA_SIMULADA", "Tarjeta simulada"),
    ]

    ESTADO_CHOICES = [
        ("PROCESADO", "Procesado"),
        ("ANULADO", "Anulado"),
    ]

    codigo = models.CharField(max_length=30, unique=True, blank=True)

    compra = models.ForeignKey(
        "compras.Compra",
        on_delete=models.PROTECT,
        related_name="pagos",
    )

    fecha_pago = models.DateField()
    monto = models.DecimalField(max_digits=12, decimal_places=2)

    metodo = models.CharField(
        max_length=30,
        choices=METODO_CHOICES,
        default="EFECTIVO",
    )

    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default="PROCESADO",
    )

    operacion = models.CharField(
        max_length=100,
        blank=True,
        help_text="Número de operación, voucher o referencia",
    )

    observacion = models.TextField(blank=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Pago"
        verbose_name_plural = "Pagos"
        ordering = ["-fecha_pago", "-id"]

    def clean(self):
        if self.monto <= 0:
            raise ValidationError("El monto del pago debe ser mayor a 0.")

        if self.compra.estado != "CONFIRMADA":
            raise ValidationError("Solo se pueden registrar pagos de compras confirmadas.")

        pagos_actuales = Pago.objects.filter(
            compra=self.compra,
            estado="PROCESADO",
        )

        if self.pk:
            pagos_actuales = pagos_actuales.exclude(pk=self.pk)

        total_pagado = pagos_actuales.aggregate(total=Sum("monto"))["total"] or Decimal("0.00")
        saldo = self.compra.total - total_pagado

        if self.estado == "PROCESADO" and self.monto > saldo:
            raise ValidationError(
                f"El pago excede el saldo pendiente. Saldo disponible: S/ {saldo}"
            )

    def save(self, *args, **kwargs):
        if self.codigo:
            self.full_clean()
            super().save(*args, **kwargs)
            return

        anio = self.fecha_pago.year if self.fecha_pago else timezone.localdate().year

        with transaction.atomic():
            self.codigo = f"TMP-{uuid.uuid4().hex[:12]}"
            self.full_clean()
            super().save(*args, **kwargs)

            self.codigo = f"PAG-{anio}-{self.id:03d}"
            super().save(update_fields=["codigo"])

    def __str__(self):
        return f"{self.codigo} - S/ {self.monto}"
