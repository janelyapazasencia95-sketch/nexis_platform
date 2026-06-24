from importlib import import_module

from django.http import JsonResponse
from rest_framework.authtoken.models import Token


def _validar_token(request):
    auth_header = request.META.get("HTTP_AUTHORIZATION", "")

    if not auth_header.startswith("Token "):
        return JsonResponse(
            {"detail": "Las credenciales de autenticación no se proveyeron."},
            status=401,
        )

    token_key = auth_header.replace("Token ", "", 1).strip()

    if not token_key:
        return JsonResponse(
            {"detail": "Cabecera token inválida."},
            status=401,
        )

    try:
        token = Token.objects.select_related("user").get(
            key=token_key,
            user__is_active=True,
        )
    except Token.DoesNotExist:
        return JsonResponse(
            {"detail": "Token inválido."},
            status=401,
        )

    request.user = token.user
    return None


def _llamar_vista_original(nombre_funcion, request, *args, **kwargs):
    error = _validar_token(request)

    if error is not None:
        return error

    vistas = import_module("reportes.views")
    vista_original = getattr(vistas, nombre_funcion)

    return vista_original(request, *args, **kwargs)


def exportar_compras_excel_seguro(request, *args, **kwargs):
    return _llamar_vista_original("exportar_compras_excel", request, *args, **kwargs)


def exportar_compras_pdf_seguro(request, *args, **kwargs):
    return _llamar_vista_original("exportar_compras_pdf", request, *args, **kwargs)
