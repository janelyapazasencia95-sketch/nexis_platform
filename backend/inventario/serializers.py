from rest_framework import serializers
from .models import LoteInventario, MovimientoInventario


class LoteInventarioSerializer(serializers.ModelSerializer):
    compra_codigo = serializers.CharField(source="compra.codigo", read_only=True)
    proveedor_nombre = serializers.CharField(source="compra.proveedor.nombre", read_only=True)
    region_nombre = serializers.CharField(source="region.nombre", read_only=True)

    class Meta:
        model = LoteInventario
        fields = "__all__"


class MovimientoInventarioSerializer(serializers.ModelSerializer):
    lote_codigo = serializers.CharField(source="lote.codigo", read_only=True)

    class Meta:
        model = MovimientoInventario
        fields = "__all__"