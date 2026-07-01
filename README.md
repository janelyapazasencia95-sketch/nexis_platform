# NEXIS Platform

NEXIS es una plataforma web para la gestión de abastecimiento, compras, pagos, inventario, reportes y trazabilidad de fibra de vicuña en diferentes regiones del Perú.

El sistema permite centralizar información de proveedores, registrar compras de fibra, controlar pagos, visualizar inventario disponible, analizar reportes y consultar un mapa operativo por regiones.

## URL del sistema desplegado

https://nexis.promube.com

## Objetivo del proyecto

El objetivo de NEXIS es mejorar el control operativo y financiero del proceso de compra de fibra de vicuña, permitiendo que una organización pueda registrar, consultar y analizar información clave desde una plataforma web.

## Módulos principales

### Dashboard

Muestra un resumen general del sistema:

- Total comprado en kilogramos.
- Total pagado.
- Deuda pendiente.
- Stock disponible.
- Proveedores activos.
- Gráficos de compras por región.
- Estado financiero pagado y pendiente.

### Proveedores

Permite registrar y consultar proveedores de fibra de vicuña.

Incluye información como:

- Nombre del proveedor.
- Documento.
- Teléfono.
- Región.
- Comunidad.
- Estado.
- Datos de contacto.

### Compras

Permite registrar compras de fibra.

Incluye:

- Fecha de compra.
- Proveedor.
- Región.
- Kilogramos comprados.
- Precio por kilogramo.
- Total de compra.
- Calidad de fibra.
- Estado de la compra.

### Pagos

Permite registrar pagos asociados a compras confirmadas.

Incluye:

- Pagos manuales.
- Métodos como efectivo, transferencia, Yape, Plin y tarjeta simulada.
- Control de pagos procesados y pendientes.
- Integración con Stripe Checkout para pago con tarjeta en entorno de prueba.

### Inventario

Permite controlar el stock de fibra disponible.

Incluye:

- Stock por compra.
- Cantidad disponible.
- Estado del inventario.
- Control de entradas según compras registradas.

### Mapa Perú

Muestra una visualización geográfica de regiones vinculadas al abastecimiento de fibra.

Actualmente el mapa visible usa Leaflet/OpenStreetMap para mantener una visualización estable. Además, el proyecto tiene configurada una variable de entorno para soporte de Google Maps API en el frontend.

### Reportes

Permite generar reportes del sistema.

Incluye exportación de:

- Compras en PDF.
- Compras en Excel.
- Proveedores en PDF.
- Inventario en PDF.
- Pagos en PDF.
- Mapa en PDF.

### Usuarios y seguridad

El sistema incluye autenticación con token.

Características:

- Login de usuario.
- Validación de sesión.
- Rutas protegidas.
- Control de acceso para módulos administrativos.
- Cierre de sesión.
- Protección de endpoints privados.

## Tecnologías usadas

### Backend

- Python
- Django
- Django REST Framework
- PostgreSQL
- Gunicorn
- Nginx

### Frontend

- React
- Vite
- Tailwind CSS
- Axios
- Recharts
- Leaflet
- Lucide React

### APIs externas

- Stripe API / Stripe Checkout para pasarela de pago desacoplada.
- Soporte de Google Maps API mediante variable de entorno del frontend.

## Pasarela de pago desacoplada

NEXIS integra Stripe Checkout para simular pagos con tarjeta.

Flujo general:

1. El usuario entra al módulo Pagos.
2. Selecciona una compra con saldo pendiente.
3. Presiona el botón Pagar Stripe.
4. NEXIS crea una sesión de pago con Stripe.
5. Stripe procesa el pago en una página externa.
6. Stripe retorna al sistema.
7. NEXIS confirma la sesión y registra el pago.

Tarjeta de prueba de Stripe:

```txt
4242 4242 4242 4242
Fecha futura
CVC cualquiera
Nombre cualquiera
