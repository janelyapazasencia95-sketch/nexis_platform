from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static


def api_estado(request):
    return JsonResponse({
        'sistema': 'NEXIS',
        'mensaje': 'Backend funcionando correctamente',
        'estado': 'OK'
    })


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/estado/', api_estado),

    path('api/usuarios/', include('usuarios.urls')),
    path('api/zonas/', include('zonas.urls')),
    path('api/proveedores/', include('proveedores.urls')),
    path('api/compras/', include('compras.urls')),
    path('api/inventario/', include('inventario.urls')),
    path('api/pagos/', include('pagos.urls')),
    path('api/reportes/', include('reportes.urls')),
    path('api/configuracion/', include('configuracion.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/mapa/', include('mapa.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)