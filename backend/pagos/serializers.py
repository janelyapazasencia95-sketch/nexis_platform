from rest_framework import serializers
from .models import Pago


class PagoSerializer(serializers.ModelSerializer):
    compra_codigo = serializers.CharField(source="compra.codigo", read_only=True)
    proveedor_nombre = serializers.CharField(source="compra.proveedor.nombre", read_only=True)
    metodo_texto = serializers.CharField(source="get_metodo_display", read_only=True)
    estado_texto = serializers.CharField(source="get_estado_display", read_only=True)

    class Meta:
        model = Pago
        fields = "__all__"
        read_only_fields = ("codigo", "fecha_registro")