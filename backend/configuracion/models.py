from django.db import models


class ConfiguracionSistema(models.Model):
    nombre_empresa = models.CharField(max_length=150, default="NEXIS Vicuña Perú S.A.C.")
    ruc = models.CharField(max_length=20, default="20601234567")
    direccion = models.CharField(max_length=250, default="Av. Principal 123, Lima")
    correo_notificaciones = models.EmailField(default="operaciones@nexis.pe")
    telefono = models.CharField(max_length=30, default="+51 999 999 999")

    moneda_base = models.CharField(max_length=10, default="PEN")
    simbolo_moneda = models.CharField(max_length=5, default="S/")
    tipo_cambio = models.DecimalField(max_digits=8, decimal_places=3, default=3.750)

    umbral_stock_bajo = models.DecimalField(max_digits=10, decimal_places=2, default=50.00)
    alerta_stock_activa = models.BooleanField(default=True)

    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Configuración del Sistema"
        verbose_name_plural = "Configuración del Sistema"

    def __str__(self):
        return self.nombre_empresa


class CalidadFibra(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.CharField(max_length=200, blank=True)
    micraje_min = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    micraje_max = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Calidad de Fibra"
        verbose_name_plural = "Calidades de Fibra"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


class EstadoProcesamiento(models.Model):
    nombre = models.CharField(max_length=100)
    color = models.CharField(max_length=30, default="azul")
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Estado de Procesamiento"
        verbose_name_plural = "Estados de Procesamiento"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre