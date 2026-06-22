from rest_framework import serializers
from .models import Region, Provincia, Comunidad


class RegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = "__all__"


class ProvinciaSerializer(serializers.ModelSerializer):
    region_nombre = serializers.CharField(source="region.nombre", read_only=True)

    class Meta:
        model = Provincia
        fields = "__all__"


class ComunidadSerializer(serializers.ModelSerializer):
    provincia_nombre = serializers.CharField(source="provincia.nombre", read_only=True)
    region_nombre = serializers.CharField(source="provincia.region.nombre", read_only=True)

    class Meta:
        model = Comunidad
        fields = "__all__"