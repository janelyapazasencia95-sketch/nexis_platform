import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  Download,
  FileText,
  Info,
  RefreshCw,
  Search,
  ShoppingCart,
  Star,
} from "lucide-react";

import api from "../services/api";

const REGION_CONFIG = [
  {
    nombre: "Puno",
    lat: -15.8402,
    lng: -70.0219,
    color: "#0B2A88",
    macro: "Macro Región Sur",
  },
  {
    nombre: "Cusco",
    lat: -13.5319,
    lng: -71.9675,
    color: "#3E46A6",
    macro: "Macro Región Sur",
  },
  {
    nombre: "Ayacucho",
    lat: -13.1631,
    lng: -74.2236,
    color: "#5575D9",
    macro: "Macro Región Centro-Sur",
  },
  {
    nombre: "Arequipa",
    lat: -16.409,
    lng: -71.5375,
    color: "#9A8CF2",
    macro: "Macro Región Sur",
  },
  {
    nombre: "Apurímac",
    lat: -13.6339,
    lng: -72.8816,
    color: "#B5ABFF",
    macro: "Macro Región Sur",
  },
  {
    nombre: "Huancavelica",
    lat: -12.7864,
    lng: -74.9764,
    color: "#6D8BEA",
    macro: "Macro Región Centro-Sur",
  },
];

function crearIconoRegion(color, activa = false) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: ${activa ? "36px" : "30px"};
        height: ${activa ? "36px" : "30px"};
        border-radius: 9999px;
        background: ${color};
        border: 5px solid white;
        box-shadow: 0 8px 22px rgba(7, 34, 107, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 9px;
          height: 9px;
          border-radius: 9999px;
          background: white;
        "></div>
      </div>
    `,
    iconSize: activa ? [36, 36] : [30, 30],
    iconAnchor: activa ? [18, 18] : [15, 15],
    popupAnchor: [0, -16],
  });
}

function Mapa() {
  const navigate = useNavigate();

  const [compras, setCompras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [pagos, setPagos] = useState([]);

  const [buscar, setBuscar] = useState("");
  const [seleccionada, setSeleccionada] = useState(null);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const obtenerLista = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.results)) return data.results;
    return [];
  };

  const normalizarTexto = (texto) =>
    String(texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const buscarConfigRegion = (nombre) => {
    const limpio = normalizarTexto(nombre);

    return REGION_CONFIG.find(
      (item) => normalizarTexto(item.nombre) === limpio
    );
  };

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError("");

      const [respCompras, respProveedores, respPagos] = await Promise.all([
        api.get("/compras/"),
        api.get("/proveedores/"),
        api.get("/pagos/"),
      ]);

      setCompras(obtenerLista(respCompras.data));
      setProveedores(obtenerLista(respProveedores.data));
      setPagos(obtenerLista(respPagos.data));
    } catch (error) {
      console.error(error);
      setError("No se pudo cargar la información del mapa.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const pagosPorCompra = useMemo(() => {
    const mapa = {};

    pagos.forEach((pago) => {
      if (pago.estado !== "PROCESADO") return;

      const compraId = String(pago.compra);
      mapa[compraId] = (mapa[compraId] || 0) + Number(pago.monto || 0);
    });

    return mapa;
  }, [pagos]);

  const resumenRegiones = useMemo(() => {
    const base = {};

    REGION_CONFIG.forEach((region) => {
      base[region.nombre] = {
        ...region,
        kg_comprados: 0,
        monto_total: 0,
        proveedores_activos: 0,
        deuda_pendiente: 0,
        compras: 0,
        calidad_predominante: "Sin datos",
        calidadConteo: {},
      };
    });

    const proveedoresPorRegion = {};

    proveedores.forEach((proveedor) => {
      const nombreRegion =
        proveedor.region_nombre ||
        proveedor.region_texto ||
        proveedor.region ||
        "";

      const config = buscarConfigRegion(nombreRegion);
      if (!config) return;

      if (!proveedoresPorRegion[config.nombre]) {
        proveedoresPorRegion[config.nombre] = new Set();
      }

      proveedoresPorRegion[config.nombre].add(proveedor.id);
    });

    compras.forEach((compra) => {
      const nombreRegion =
        compra.region_nombre || compra.region_texto || compra.region || "";

      const config = buscarConfigRegion(nombreRegion);
      if (!config) return;

      const item = base[config.nombre];

      const kg = Number(compra.kilogramos || 0);
      const total = Number(compra.total || 0);
      const pagado = Number(pagosPorCompra[String(compra.id)] || 0);
      const deuda = Math.max(total - pagado, 0);

      item.kg_comprados += kg;
      item.monto_total += total;
      item.deuda_pendiente += deuda;
      item.compras += 1;

      const calidad = compra.calidad_texto || compra.calidad || "Sin calidad";
      item.calidadConteo[calidad] = (item.calidadConteo[calidad] || 0) + 1;
    });

    Object.keys(base).forEach((nombre) => {
      base[nombre].proveedores_activos =
        proveedoresPorRegion[nombre]?.size || 0;

      const calidadMayor = Object.entries(base[nombre].calidadConteo).sort(
        (a, b) => b[1] - a[1]
      )[0];

      base[nombre].calidad_predominante = calidadMayor
        ? calidadMayor[0]
        : "Sin datos";
    });

    return REGION_CONFIG.map((region) => base[region.nombre]);
  }, [compras, proveedores, pagosPorCompra]);

  useEffect(() => {
    if (!seleccionada && resumenRegiones.length > 0) {
      const puno =
        resumenRegiones.find(
          (item) => normalizarTexto(item.nombre) === "puno"
        ) || resumenRegiones[0];

      setSeleccionada(puno);
    }
  }, [resumenRegiones, seleccionada]);

  const regionesFiltradas = useMemo(() => {
    return resumenRegiones.filter((region) =>
      normalizarTexto(region.nombre).includes(normalizarTexto(buscar))
    );
  }, [resumenRegiones, buscar]);

  const comprasRecientesRegion = useMemo(() => {
    if (!seleccionada) return [];

    return compras
      .filter(
        (compra) =>
          normalizarTexto(compra.region_nombre || compra.region || "") ===
          normalizarTexto(seleccionada.nombre)
      )
      .sort((a, b) => new Date(b.fecha_compra) - new Date(a.fecha_compra))
      .slice(0, 3);
  }, [compras, seleccionada]);

  const formatoSoles = (valor) => {
    const numero = Number(valor || 0);

    return `S/ ${numero.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatoKg = (valor) => {
    const numero = Number(valor || 0);

    return `${numero.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} kg`;
  };

  const exportarPDF = () => {
    window.open(
      "http://127.0.0.1:8000/api/reportes/exportar-mapa-pdf/",
      "_blank"
    );
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-[28px] font-bold leading-tight text-azul sm:text-[32px]">
            Mapa Perú
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-textoSuave sm:text-base">
            Visualización geográfica real del abastecimiento nacional de fibra de
            vicuña.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={cargarDatos}
            className="flex items-center justify-center gap-2 rounded-xl bg-azulClaro px-5 py-3 text-sm font-bold text-azul transition hover:bg-borde"
          >
            <RefreshCw size={18} />
            Actualizar
          </button>

          <button
            onClick={exportarPDF}
            className="flex items-center justify-center gap-2 rounded-xl bg-azul px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-azul2"
          >
            <Download size={18} />
            Descargar PDF
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_390px]">
        <div className="overflow-hidden rounded-xl border border-borde bg-white shadow-sm">
          <div className="border-b border-borde bg-white px-6 py-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-3 text-gris" size={18} />
              <input
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                placeholder="Buscar región..."
                className="w-full rounded-full border border-borde bg-azulSuave py-2.5 pl-10 pr-4 text-sm outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
              />
            </div>
          </div>

          <div className="relative h-[720px]">
            <MapContainer
              center={[-9.19, -75.0152]}
              zoom={5}
              minZoom={5}
              maxZoom={8}
              scrollWheelZoom={true}
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {regionesFiltradas.map((region) => {
                const activa =
                  normalizarTexto(seleccionada?.nombre) ===
                  normalizarTexto(region.nombre);

                return (
                  <Fragment key={region.nombre}>
                    <CircleMarker
                      center={[region.lat, region.lng]}
                      radius={activa ? 25 : 18}
                      pathOptions={{
                        color: region.color,
                        fillColor: region.color,
                        fillOpacity: activa ? 0.32 : 0.2,
                        weight: 2,
                      }}
                    />

                    <Marker
                      position={[region.lat, region.lng]}
                      icon={crearIconoRegion(region.color, activa)}
                      eventHandlers={{
                        click: () => setSeleccionada(region),
                      }}
                    >
                      <Popup>
                        <div className="min-w-[180px]">
                          <strong>{region.nombre}</strong>
                          <br />
                          Kg comprados: {formatoKg(region.kg_comprados)}
                          <br />
                          Proveedores: {region.proveedores_activos}
                        </div>
                      </Popup>
                    </Marker>
                  </Fragment>
                );
              })}
            </MapContainer>

            <div className="absolute bottom-6 left-6 z-[500] w-[280px] rounded-2xl border border-borde bg-white/95 p-5 shadow-md backdrop-blur">
              <h3 className="mb-4 text-lg font-bold text-azul">
                Zonas de Acopio
              </h3>

              <div className="space-y-3">
                {REGION_CONFIG.slice(0, 5).map((item) => (
                  <div key={item.nombre} className="flex items-center gap-3">
                    <span
                      className="h-4 w-4 rounded-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-texto">{item.nombre}</span>
                  </div>
                ))}

                <div className="flex items-center gap-3">
                  <span className="h-4 w-4 rounded-sm border border-borde bg-[#DCE6F5]" />
                  <span className="text-sm text-texto">Otras regiones</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="rounded-xl border border-borde bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-2xl font-bold text-azul">
              Detalle de Región
            </h3>
            <Info className="text-gris" size={22} />
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-rojoClaro p-4 text-rojo">
              {error}
            </div>
          )}

          {cargando ? (
            <p className="text-textoSuave">Cargando información...</p>
          ) : seleccionada ? (
            <>
              <div className="rounded-xl border border-borde p-6">
                <div className="mb-6 flex items-center gap-4">
                  <div
                    className="h-12 w-3 rounded-full"
                    style={{ backgroundColor: seleccionada.color }}
                  />

                  <div>
                    <h4 className="text-2xl font-bold text-texto">
                      {seleccionada.nombre}
                    </h4>
                    <p className="text-sm text-textoSuave">
                      {seleccionada.macro}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <DatoMapa
                    titulo="Kg comprados"
                    valor={formatoKg(seleccionada.kg_comprados)}
                  />

                  <DatoMapa
                    titulo="Monto total"
                    valor={formatoSoles(seleccionada.monto_total)}
                  />

                  <DatoMapa
                    titulo="Prov. activos"
                    valor={seleccionada.proveedores_activos}
                  />

                  <DatoMapa
                    titulo="Deuda pend."
                    valor={formatoSoles(seleccionada.deuda_pendiente)}
                    rojo
                  />
                </div>

                <div className="mt-6 border-t border-borde pt-5">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-textoSuave">
                    Calidad predominante
                  </p>

                  <div className="flex items-center gap-2">
                    <Star size={18} className="text-azul2" />
                    <span className="font-semibold text-texto">
                      {seleccionada.calidad_predominante}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <button
                  onClick={() => navigate("/proveedores")}
                  className="w-full rounded-lg bg-azul px-5 py-3 text-sm font-bold text-white transition hover:bg-azul2"
                >
                  Ver proveedores en {seleccionada.nombre}
                </button>

                <button
                  onClick={exportarPDF}
                  className="w-full rounded-lg bg-azulClaro px-5 py-3 text-sm font-bold text-azul transition hover:bg-borde"
                >
                  Descargar reporte PDF
                </button>
              </div>

              <div className="mt-8">
                <h4 className="mb-4 text-lg font-semibold text-texto">
                  Actividad reciente
                </h4>

                <div className="space-y-3">
                  {comprasRecientesRegion.length === 0 ? (
                    <div className="rounded-lg bg-azulSuave p-4 text-sm text-textoSuave">
                      No hay actividad reciente en esta región.
                    </div>
                  ) : (
                    comprasRecientesRegion.map((compra) => (
                      <div
                        key={compra.id}
                        className="flex items-start gap-3 rounded-lg bg-[#F6F8FF] p-4"
                      >
                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-azulClaro text-azul">
                          <ShoppingCart size={18} />
                        </div>

                        <div className="flex-1">
                          <p className="font-semibold text-texto">
                            Nueva compra: {Number(compra.kilogramos || 0)} kg
                          </p>
                          <p className="text-sm text-textoSuave">
                            {compra.proveedor_nombre || "Proveedor"}
                          </p>
                        </div>

                        <span className="text-xs text-gris">Reciente</span>
                      </div>
                    ))
                  )}

                  {comprasRecientesRegion.length > 0 && (
                    <div className="flex items-start gap-3 rounded-lg bg-[#F6F8FF] p-4">
                      <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-azulClaro text-azul">
                        <FileText size={18} />
                      </div>

                      <div className="flex-1">
                        <p className="font-semibold text-texto">
                          Resumen financiero actualizado
                        </p>
                        <p className="text-sm text-textoSuave">
                          Datos calculados desde compras y pagos.
                        </p>
                      </div>

                      <span className="text-xs text-gris">Sistema</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p className="text-textoSuave">Selecciona una región del mapa.</p>
          )}
        </aside>
      </section>
    </div>
  );
}

function DatoMapa({ titulo, valor, rojo = false }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-textoSuave">
        {titulo}
      </p>

      <p
        className={`mt-1 text-xl font-extrabold ${
          rojo ? "text-rojo" : "text-azul"
        }`}
      >
        {valor}
      </p>
    </div>
  );
}

export default Mapa;