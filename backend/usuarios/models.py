from django.conf import settings
from django.db import models


def ruta_foto_perfil(instance, filename):
    return f"usuarios/perfiles/{instance.user_id}/{filename}"


class PerfilUsuario(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="perfil",
    )
    foto_perfil = models.ImageField(
        upload_to=ruta_foto_perfil,
        blank=True,
        null=True,
    )
    creado = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Perfil de {self.user.username}"
