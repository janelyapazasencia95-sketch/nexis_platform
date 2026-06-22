from django.db import models


class LoteInventario(models.Model):
    ESTADO_CHOICES = [
        ("DISPONIBLE", "Disponible"),
        ("RESERVADO", "Reservado"),
        ("AGOTADO", "Agotado"),
    ]

    codigo = models.CharField(max_length=30, unique=True, blank=True)

    compra = models.OneToOneField(
        "compras.Compra",
        on_delete=models.PROTECT,
        related_name="lote_inventario"
    )

    region = models.ForeignKey(
        "zonas.Region",
        on_delete=models.PROTECT,
        related_name="lotes"
    )

    calidad = models.CharField(max_length=30)
    kg_inicial = models.DecimalField(max_digits=10, decimal_places=2)
    kg_actual = models.DecimalField(max_digits=10, decimal_places=2)

    ubicacion = models.CharField(
        max_length=150,
        default="Almacén Central"
    )

    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default="DISPONIBLE"
    )

    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Lote de Inventario"
        verbose_name_plural = "Lotes de Inventario"
        ordering = ["-fecha_creacion"]

    def save(self, *args, **kwargs):
        if not self.codigo:
            ultimo_id = LoteInventario.objects.count() + 1
            self.codigo = f"LOTE-2024-{ultimo_id:03d}"

        if self.kg_actual <= 0:
            self.estado = "AGOTADO"

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.codigo} - {self.kg_actual} kg"


class MovimientoInventario(models.Model):
    TIPO_CHOICES = [
        ("ENTRADA", "Entrada"),
        ("SALIDA", "Salida"),
        ("AJUSTE", "Ajuste"),
    ]

    lote = models.ForeignKey(
        LoteInventario,
        on_delete=models.PROTECT,
        related_name="movimientos"
    )

    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    cantidad_kg = models.DecimalField(max_digits=10, decimal_places=2)
    motivo = models.CharField(max_length=250)
    fecha_movimiento = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Movimiento de Inventario"
        verbose_name_plural = "Movimientos de Inventario"
        ordering = ["-fecha_movimiento"]

    def __str__(self):
        return f"{self.tipo} - {self.cantidad_kg} kg"