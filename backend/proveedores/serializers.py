from rest_framework import serializers
from .models import Proveedor


class ProveedorSerializer(serializers.ModelSerializer):
    region_nombre = serializers.CharField(source="region.nombre", read_only=True)
    provincia_nombre = serializers.CharField(source="provincia.nombre", read_only=True)
    comunidad_nombre = serializers.CharField(source="comunidad.nombre", read_only=True)

    class Meta:
        model = Proveedor
        fields = "__all__"