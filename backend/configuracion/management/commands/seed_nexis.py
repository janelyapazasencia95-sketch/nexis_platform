from decimal import Decimal
from datetime import date

from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, User

from zonas.models import Region, Provincia, Comunidad
from proveedores.models import Proveedor
from compras.models import Compra
from pagos.models import Pago
from configuracion.models import (
    ConfiguracionSistema,
    CalidadFibra,
    EstadoProcesamiento,
)


class Command(BaseCommand):
    help = "Carga datos iniciales para el sistema NEXIS"

    def handle(self, *args, **kwargs):
        self.stdout.write("Cargando datos iniciales de NEXIS...")

        # Roles
        for rol in ["Administrador", "Operador", "Visualizador"]:
            Group.objects.get_or_create(name=rol)

        # Usuario operador de prueba
        if not User.objects.filter(username="operador").exists():
            operador = User.objects.create_user(
                username="operador",
                email="operador@nexis.pe",
                password="operador12345",
                first_name="Operador",
                last_name="NEXIS",
                is_active=True,
            )
            grupo = Group.objects.get(name="Operador")
            operador.groups.add(grupo)

        # Configuración principal
        ConfiguracionSistema.objects.get_or_create(
            id=1,
            defaults={
                "nombre_empresa": "NEXIS Vicuña Perú S.A.C.",
                "ruc": "20601234567",
                "direccion": "Av. Principal 123, Lima",
                "correo_notificaciones": "operaciones@nexis.pe",
                "telefono": "+51 999 999 999",
                "moneda_base": "PEN",
                "simbolo_moneda": "S/",
                "tipo_cambio": Decimal("3.750"),
                "umbral_stock_bajo": Decimal("50.00"),
                "alerta_stock_activa": True,
            }
        )

        # Calidades
        calidades = [
            ("Premium A1", "Fibra extra fina de alta calidad", Decimal("0.00"), Decimal("12.50")),
            ("Estándar", "Fibra de calidad comercial", Decimal("12.50"), Decimal("14.50")),
            ("Calidad B", "Fibra secundaria para procesamiento", Decimal("14.50"), Decimal("18.00")),
        ]

        for nombre, descripcion, micraje_min, micraje_max in calidades:
            CalidadFibra.objects.get_or_create(
                nombre=nombre,
                defaults={
                    "descripcion": descripcion,
                    "micraje_min": micraje_min,
                    "micraje_max": micraje_max,
                    "activo": True,
                }
            )

        # Estados de procesamiento
        estados = [
            ("Recibido", "azul"),
            ("En limpieza", "amarillo"),
            ("Certificado", "verde"),
            ("En almacén", "morado"),
        ]

        for nombre, color in estados:
            EstadoProcesamiento.objects.get_or_create(
                nombre=nombre,
                defaults={
                    "color": color,
                    "activo": True,
                }
            )

        # Regiones
        regiones_data = [
            ("Puno", "PUN"),
            ("Ayacucho", "AYA"),
            ("Cusco", "CUS"),
            ("Arequipa", "ARE"),
            ("Apurímac", "APU"),
            ("Huancavelica", "HUV"),
        ]

        regiones = {}

        for nombre, codigo in regiones_data:
            region, _ = Region.objects.get_or_create(
                codigo=codigo,
                defaults={
                    "nombre": nombre,
                    "activo": True,
                }
            )
            regiones[nombre] = region

        # Provincias
        provincias_data = [
            ("Puno", "Puno"),
            ("Ayacucho", "Lucanas"),
            ("Cusco", "Canchis"),
            ("Arequipa", "Caylloma"),
            ("Apurímac", "Abancay"),
            ("Huancavelica", "Huancavelica"),
        ]

        provincias = {}

        for region_nombre, provincia_nombre in provincias_data:
            provincia, _ = Provincia.objects.get_or_create(
                region=regiones[region_nombre],
                nombre=provincia_nombre,
                defaults={"activo": True}
            )
            provincias[provincia_nombre] = provincia

        # Comunidades
        comunidades_data = [
            ("Lucanas", "Comunidad Campesina Lucanas"),
            ("Puno", "Asociación Vicuñeros Puno"),
            ("Abancay", "Cooperativa Alto Andina"),
            ("Puno", "Comunidad San Antonio de Putina"),
            ("Lucanas", "Asociación Pampa Galeras"),
            ("Canchis", "Comunidad de Marcapata"),
            ("Huancavelica", "Asociación Los Andes"),
            ("Caylloma", "Comunidad Alto Perú"),
        ]

        comunidades = {}

        for provincia_nombre, comunidad_nombre in comunidades_data:
            comunidad, _ = Comunidad.objects.get_or_create(
                provincia=provincias[provincia_nombre],
                nombre=comunidad_nombre,
                defaults={"activo": True}
            )
            comunidades[comunidad_nombre] = comunidad

        # Proveedores
        proveedores_data = [
            {
                "nombre": "Comunidad Campesina Lucanas",
                "tipo_proveedor": "COMUNIDAD",
                "tipo_documento": "RUC",
                "numero_documento": "20600000001",
                "region": "Ayacucho",
                "provincia": "Lucanas",
                "comunidad": "Comunidad Campesina Lucanas",
                "telefono": "999111222",
                "correo": "lucanas@nexis.pe",
            },
            {
                "nombre": "Asociación Vicuñeros Puno",
                "tipo_proveedor": "ASOCIACION",
                "tipo_documento": "RUC",
                "numero_documento": "20600000002",
                "region": "Puno",
                "provincia": "Puno",
                "comunidad": "Asociación Vicuñeros Puno",
                "telefono": "999222333",
                "correo": "vicuneros.puno@nexis.pe",
            },
            {
                "nombre": "Cooperativa Alto Andina",
                "tipo_proveedor": "COOPERATIVA",
                "tipo_documento": "RUC",
                "numero_documento": "20600000003",
                "region": "Apurímac",
                "provincia": "Abancay",
                "comunidad": "Cooperativa Alto Andina",
                "telefono": "999333444",
                "correo": "altoandina@nexis.pe",
            },
            {
                "nombre": "Manuel Quispe Huamán",
                "tipo_proveedor": "PERSONA",
                "tipo_documento": "DNI",
                "numero_documento": "45678912",
                "region": "Puno",
                "provincia": "Puno",
                "comunidad": "Comunidad San Antonio de Putina",
                "telefono": "999444555",
                "correo": "manuel.quispe@nexis.pe",
            },
        ]

        proveedores = {}

        for item in proveedores_data:
            proveedor, _ = Proveedor.objects.get_or_create(
                numero_documento=item["numero_documento"],
                defaults={
                    "nombre": item["nombre"],
                    "tipo_proveedor": item["tipo_proveedor"],
                    "tipo_documento": item["tipo_documento"],
                    "region": regiones[item["region"]],
                    "provincia": provincias[item["provincia"]],
                    "comunidad": comunidades[item["comunidad"]],
                    "telefono": item["telefono"],
                    "correo": item["correo"],
                    "direccion": "Dirección registrada en zona altoandina",
                    "activo": True,
                }
            )
            proveedores[item["nombre"]] = proveedor

        # Compras
        compras_data = [
            ("Comunidad Campesina Lucanas", "Ayacucho", date(2024, 10, 24), Decimal("250.00"), Decimal("170.00"), "PREMIUM_A1", "CONFIRMADA"),
            ("Asociación Vicuñeros Puno", "Puno", date(2024, 10, 22), Decimal("175.50"), Decimal("165.00"), "PREMIUM_A1", "CONFIRMADA"),
            ("Cooperativa Alto Andina", "Apurímac", date(2024, 10, 19), Decimal("60.00"), Decimal("145.00"), "CALIDAD_B", "ANULADA"),
            ("Manuel Quispe Huamán", "Puno", date(2024, 10, 18), Decimal("80.00"), Decimal("160.00"), "ESTANDAR", "BORRADOR"),
        ]

        compras_creadas = []

        for proveedor_nombre, region_nombre, fecha, kg, precio, calidad, estado in compras_data:
            existe = Compra.objects.filter(
                proveedor=proveedores[proveedor_nombre],
                fecha_compra=fecha,
                kilogramos=kg,
                precio_kg=precio,
            ).first()

            if existe:
                compra = existe
            else:
                compra = Compra.objects.create(
                    proveedor=proveedores[proveedor_nombre],
                    region=regiones[region_nombre],
                    fecha_compra=fecha,
                    kilogramos=kg,
                    precio_kg=precio,
                    calidad=calidad,
                    estado=estado,
                    observacion="Dato inicial cargado automáticamente",
                )

            compras_creadas.append(compra)

        # Pagos de prueba
        compra_confirmada = Compra.objects.filter(
            proveedor__nombre="Comunidad Campesina Lucanas",
            estado="CONFIRMADA"
        ).first()

        if compra_confirmada:
            if not Pago.objects.filter(compra=compra_confirmada, operacion="OP-SEED-001").exists():
                Pago.objects.create(
                    compra=compra_confirmada,
                    fecha_pago=date(2024, 10, 25),
                    monto=Decimal("20000.00"),
                    metodo="TRANSFERENCIA",
                    estado="PROCESADO",
                    operacion="OP-SEED-001",
                    observacion="Pago inicial de prueba",
                )

        self.stdout.write(self.style.SUCCESS("Datos iniciales cargados correctamente."))