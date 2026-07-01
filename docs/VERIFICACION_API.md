# Verificación técnica de NEXIS

## API interna

El sistema tiene endpoints REST desarrollados con Django REST Framework.

Prueba pública:

```bash
curl -s -o /dev/null -w "API_ESTADO=%{http_code}\n" https://nexis.promube.com/api/estado/
API_ESTADO=200
