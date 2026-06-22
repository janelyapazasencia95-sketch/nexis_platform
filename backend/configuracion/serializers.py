from rest_framework import serializers
from .models import ConfiguracionSistema, CalidadFibra, EstadoProcesamiento


class ConfiguracionSistemaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracionSistema
        fields = "__all__"


class CalidadFibraSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalidadFibra
        fields = "__all__"


class EstadoProcesamientoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoProcesamiento
        fields = "__all__"