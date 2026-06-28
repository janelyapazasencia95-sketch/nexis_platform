from django.db import models


class Region(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    codigo = models.CharField(max_length=10, unique=True)
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Región"
        verbose_name_plural = "Regiones"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


class Provincia(models.Model):
    region = models.ForeignKey(
        Region,
        on_delete=models.CASCADE,
        related_name="provincias",
    )
    nombre = models.CharField(max_length=100)
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Provincia"
        verbose_name_plural = "Provincias"
        ordering = ["region__nombre", "nombre"]
        unique_together = (("region", "nombre"),)

    def __str__(self):
        return f"{self.nombre} - {self.region.nombre}"


class Comunidad(models.Model):
    provincia = models.ForeignKey(
        Provincia,
        on_delete=models.CASCADE,
        related_name="comunidades",
    )
    nombre = models.CharField(max_length=150)
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Comunidad"
        verbose_name_plural = "Comunidades"
        ordering = ["provincia__nombre", "nombre"]
        unique_together = (("provincia", "nombre"),)

    def __str__(self):
        return f"{self.nombre} - {self.provincia.nombre}"
