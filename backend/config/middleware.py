from django.http import JsonResponse
from django.contrib.auth.models import AnonymousUser
from rest_framework.authtoken.models import Token


class NexisExportTokenMiddleware:
    """
    Protege descargas/exportaciones de reportes.
    Exige Authorization: Token <token> para rutas /api/reportes/exportar-...
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path

        if path.startswith("/api/reportes/exportar-"):
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
                request.user = token.user
            except Token.DoesNotExist:
                request.user = AnonymousUser()
                return JsonResponse(
                    {"detail": "Token inválido."},
                    status=401,
                )

        return self.get_response(request)
