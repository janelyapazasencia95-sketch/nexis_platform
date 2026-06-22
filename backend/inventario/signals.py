from django.db.models.signals import post_save
from django.dispatch import receiver

from compras.models import Compra
from .models import LoteInventario, MovimientoInventario


@receiver(post_save, sender=Compra)
def crear_lote_desde_compra(sender, instance, created, **kwargs):
    if instance.estado != "CONFIRMADA":
        return

    if hasattr(instance, "lote_inventario"):
        return

    lote = LoteInventario.objects.create(
        compra=instance,
        region=instance.region,
        calidad=instance.get_calidad_display(),
        kg_inicial=instance.kilogramos,
        kg_actual=instance.kilogramos,
        ubicacion="Almacén Central",
        estado="DISPONIBLE",
    )

    MovimientoInventario.objects.create(
        lote=lote,
        tipo="ENTRADA",
        cantidad_kg=instance.kilogramos,
        motivo=f"Entrada generada por compra {instance.codigo}",
    )