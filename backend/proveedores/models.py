from django.db import models


class Proveedor(models.Model):
    TIPO_DOCUMENTO_CHOICES = [
        ("DNI", "DNI"),
        ("RUC", "RUC"),
    ]

    TIPO_PROVEEDOR_CHOICES = [
        ("PERSONA", "Persona natural"),
        ("COMUNIDAD", "Comunidad"),
        ("ASOCIACION", "Asociación"),
        ("COOPERATIVA", "Cooperativa"),
    ]

    nombre = models.CharField(max_length=180)
    tipo_proveedor = models.CharField(
        max_length=20,
        choices=TIPO_PROVEEDOR_CHOICES,
        default="PERSONA"
    )
    tipo_documento = models.CharField(
        max_length=10,
        choices=TIPO_DOCUMENTO_CHOICES,
        default="DNI"
    )
    numero_documento = models.CharField(max_length=20, unique=True)

    region = models.ForeignKey(
        "zonas.Region",
        on_delete=models.PROTECT,
        related_name="proveedores"
    )
    provincia = models.ForeignKey(
        "zonas.Provincia",
        on_delete=models.PROTECT,
        related_name="proveedores",
        null=True,
        blank=True
    )
    comunidad = models.ForeignKey(
        "zonas.Comunidad",
        on_delete=models.SET_NULL,
        related_name="proveedores",
        null=True,
        blank=True
    )

    telefono = models.CharField(max_length=20, blank=True)
    correo = models.EmailField(blank=True)
    direccion = models.CharField(max_length=250, blank=True)

    activo = models.BooleanField(default=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Proveedor"
        verbose_name_plural = "Proveedores"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre