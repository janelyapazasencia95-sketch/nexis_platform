from rest_framework import serializers
from .models import Compra


class CompraSerializer(serializers.ModelSerializer):
    proveedor_nombre = serializers.CharField(source="proveedor.nombre", read_only=True)
    region_nombre = serializers.CharField(source="region.nombre", read_only=True)
    calidad_texto = serializers.CharField(source="get_calidad_display", read_only=True)
    estado_texto = serializers.CharField(source="get_estado_display", read_only=True)

    class Meta:
        model = Compra
        fields = "__all__"
        read_only_fields = ("codigo", "total", "fecha_registro", "fecha_actualizacion")

    def validate(self, data):
        kilogramos = data.get("kilogramos")
        precio_kg = data.get("precio_kg")

        if kilogramos is not None and kilogramos <= 0:
            raise serializers.ValidationError("Los kilogramos deben ser mayores a 0.")

        if precio_kg is not None and precio_kg <= 0:
            raise serializers.ValidationError("El precio por kg debe ser mayor a 0.")

        return data