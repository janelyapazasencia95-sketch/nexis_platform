from rest_framework import serializers

from .models import Proveedor


class ProveedorSerializer(serializers.ModelSerializer):
    region_nombre = serializers.CharField(source="region.nombre", read_only=True)
    provincia_nombre = serializers.CharField(source="provincia.nombre", read_only=True)
    comunidad_nombre = serializers.CharField(source="comunidad.nombre", read_only=True)

    class Meta:
        model = Proveedor
        fields = "__all__"

    def validate(self, data):
        region = data.get("region", getattr(self.instance, "region", None))
        provincia = data.get("provincia", getattr(self.instance, "provincia", None))
        comunidad = data.get("comunidad", getattr(self.instance, "comunidad", None))

        if region and not region.activo:
            raise serializers.ValidationError({
                "region": "La región seleccionada está inactiva."
            })

        if provincia and not provincia.activo:
            raise serializers.ValidationError({
                "provincia": "La provincia seleccionada está inactiva."
            })

        if comunidad and not comunidad.activo:
            raise serializers.ValidationError({
                "comunidad": "La comunidad seleccionada está inactiva."
            })

        if provincia and region and provincia.region_id != region.id:
            raise serializers.ValidationError({
                "provincia": "La provincia seleccionada no pertenece a la región indicada."
            })

        if comunidad:
            if not provincia:
                provincia = comunidad.provincia
                data["provincia"] = provincia

            if comunidad.provincia_id != provincia.id:
                raise serializers.ValidationError({
                    "comunidad": "La comunidad seleccionada no pertenece a la provincia indicada."
                })

            if region and comunidad.provincia.region_id != region.id:
                raise serializers.ValidationError({
                    "comunidad": "La comunidad seleccionada no pertenece a la región indicada."
                })

        return data
