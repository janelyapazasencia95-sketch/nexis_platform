from decimal import Decimal
import uuid

from django.db import models, transaction
from django.utils import timezone


class Compra(models.Model):
    ESTADO_CHOICES = [
        ("BORRADOR", "Borrador"),
        ("CONFIRMADA", "Confirmada"),
        ("ANULADA", "Anulada"),
    ]

    CALIDAD_CHOICES = [
        ("PREMIUM_A1", "Premium A1"),
        ("ESTANDAR", "Estándar"),
        ("CALIDAD_B", "Calidad B"),
    ]

    codigo = models.CharField(max_length=30, unique=True, blank=True)

    proveedor = models.ForeignKey(
        "proveedores.Proveedor",
        on_delete=models.PROTECT,
        related_name="compras",
    )

    region = models.ForeignKey(
        "zonas.Region",
        on_delete=models.PROTECT,
        related_name="compras",
    )

    fecha_compra = models.DateField()

    kilogramos = models.DecimalField(max_digits=10, decimal_places=2)
    precio_kg = models.DecimalField(max_digits=10, decimal_places=2)

    total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    calidad = models.CharField(
        max_length=20,
        choices=CALIDAD_CHOICES,
        default="ESTANDAR",
    )

    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default="BORRADOR",
    )

    observacion = models.TextField(blank=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Compra"
        verbose_name_plural = "Compras"
        ordering = ["-fecha_compra", "-id"]

    def save(self, *args, **kwargs):
        self.total = self.kilogramos * self.precio_kg

        if self.codigo:
            super().save(*args, **kwargs)
            return

        anio = self.fecha_compra.year if self.fecha_compra else timezone.localdate().year

        with transaction.atomic():
            self.codigo = f"TMP-{uuid.uuid4().hex[:12]}"
            super().save(*args, **kwargs)

            self.codigo = f"CMP-{anio}-{self.id:03d}"
            super().save(update_fields=["codigo", "total", "fecha_actualizacion"])

    def __str__(self):
        return f"{self.codigo} - {self.proveedor.nombre}"
