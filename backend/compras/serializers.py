from rest_framework import serializers

from .models import Compra


class CompraSerializer(serializers.ModelSerializer):
    proveedor_nombre = serializers.CharField(source="proveedor.nombre", read_only=True)
    region_nombre = serializers.CharField(source="region.nombre", read_only=True)

    calidad_texto = serializers.SerializerMethodField()
    estado_texto = serializers.CharField(source="get_estado_display", read_only=True)

    calidad_fibra_nombre = serializers.CharField(
        source="calidad_fibra.nombre",
        read_only=True,
    )

    estado_procesamiento_nombre = serializers.CharField(
        source="estado_procesamiento.nombre",
        read_only=True,
    )

    estado_procesamiento_color = serializers.CharField(
        source="estado_procesamiento.color",
        read_only=True,
    )

    class Meta:
        model = Compra
        fields = "__all__"
        read_only_fields = ("codigo", "total", "fecha_registro", "fecha_actualizacion")

    def get_calidad_texto(self, obj):
        if obj.calidad_fibra:
            return obj.calidad_fibra.nombre
        return obj.get_calidad_display()

    def validate_calidad_fibra(self, value):
        if value and not value.activo:
            raise serializers.ValidationError("La calidad de fibra seleccionada está inactiva.")
        return value

    def validate_estado_procesamiento(self, value):
        if value and not value.activo:
            raise serializers.ValidationError("El estado de procesamiento seleccionado está inactivo.")
        return value

    def validate(self, data):
        kilogramos = data.get("kilogramos")
        precio_kg = data.get("precio_kg")

        if kilogramos is not None and kilogramos <= 0:
            raise serializers.ValidationError("Los kilogramos deben ser mayores a 0.")

        if precio_kg is not None and precio_kg <= 0:
            raise serializers.ValidationError("El precio por kg debe ser mayor a 0.")

        return data
