import { downloadFile } from "../services/download";
import { useEffect, useMemo, useState } from "react";
import {
  Award,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Coins,
  Eye,
  FileSpreadsheet,
  FileText,
  FilterX,
  RefreshCw,
  Scale,
  Search,
  Truck,
  XCircle,
} from "lucide-react";
import api from "../services/api";

const estadosCompra = {
  BORRADOR: {
    texto: "Pendiente",
    clase: "text-amber-600",
    chip: "bg-amber-100 text-amber-700",
    icono: Clock3,
  },
  CONFIRMADA: {
    texto: "Completado",
    clase: "text-green-700",
    chip: "bg-green-100 text-green-800",
    icono: CheckCircle,
  },
  ANULADA: {
    texto: "Anulado",
    clase: "text-rojo",
    chip: "bg-rojoClaro text-rojo",
    icono: XCircle,
  },
};

const calidades = {
  PREMIUM_A1: "Grado A",
  ESTANDAR: "Grado B",
  CALIDAD_B: "Grado C",
};

function Reportes() {
  const [compras, setCompras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [regiones, setRegiones] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [pagos, setPagos] = useState([]);

  const [buscar, setBuscar] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [region, setRegion] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [estado, setEstado] = useState("");
  const [calidad, setCalidad] = useState("");

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const obtenerLista = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.results)) return data.results;
    return [];
  };

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError("");

      const [
        respuestaCompras,
        respuestaProveedores,
        respuestaRegiones,
        respuestaInventario,
        respuestaPagos,
      ] = await Promise.all([
        api.get("/compras/"),
        api.get("/proveedores/"),
        api.get("/zonas/regiones/"),
        api.get("/inventario/lotes/"),
        api.get("/pagos/"),
      ]);

      setCompras(obtenerLista(respuestaCompras.data));
      setProveedores(obtenerLista(respuestaProveedores.data));
      setRegiones(obtenerLista(respuestaRegiones.data));
      setInventario(obtenerLista(respuestaInventario.data));
      setPagos(obtenerLista(respuestaPagos.data));
    } catch (error) {
      console.error(error);
      setError("No se pudo cargar la información de reportes.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

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

  const formatoFecha = (valor) => {
    if (!valor) return "Sin fecha";

    return new Date(valor).toLocaleDateString("es-PE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const comprasFiltradas = useMemo(() => {
    return compras.filter((compra) => {
      const texto = `
        ${compra.codigo || ""}
        ${compra.proveedor_nombre || ""}
        ${compra.region_nombre || ""}
        ${compra.calidad_texto || ""}
        ${compra.estado || ""}
      `.toLowerCase();

      const coincideBusqueda = texto.includes(buscar.toLowerCase());

      const coincideFechaInicio = fechaInicio
        ? compra.fecha_compra >= fechaInicio
        : true;

      const coincideFechaFin = fechaFin
        ? compra.fecha_compra <= fechaFin
        : true;

      const coincideRegion = region
        ? String(compra.region) === String(region)
        : true;

      const coincideProveedor = proveedor
        ? String(compra.proveedor) === String(proveedor)
        : true;

      const coincideEstado = estado ? compra.estado === estado : true;

      const coincideCalidad = calidad ? compra.calidad === calidad : true;

      return (
        coincideBusqueda &&
        coincideFechaInicio &&
        coincideFechaFin &&
        coincideRegion &&
        coincideProveedor &&
        coincideEstado &&
        coincideCalidad
      );
    });
  }, [
    compras,
    buscar,
    fechaInicio,
    fechaFin,
    region,
    proveedor,
    estado,
    calidad,
  ]);

  const totalKg = comprasFiltradas
    .filter((compra) => compra.estado === "CONFIRMADA")
    .reduce((suma, compra) => suma + Number(compra.kilogramos || 0), 0);

  const valorTotal = comprasFiltradas
    .filter((compra) => compra.estado === "CONFIRMADA")
    .reduce((suma, compra) => suma + Number(compra.total || 0), 0);

  const pagosProcesados = pagos
    .filter((pago) => pago.estado === "PROCESADO")
    .reduce((suma, pago) => suma + Number(pago.monto || 0), 0);

  const stockDisponible = inventario.reduce(
    (suma, lote) => suma + Number(lote.kg_actual || 0),
    0
  );

  const enviosActivos = comprasFiltradas.filter(
    (compra) => compra.estado !== "ANULADA"
  ).length;

  const calidadPromedio = useMemo(() => {
    const conteo = {};

    comprasFiltradas.forEach((compra) => {
      const nombre = calidades[compra.calidad] || compra.calidad_texto || "Sin calidad";
      conteo[nombre] = (conteo[nombre] || 0) + 1;
    });

    const resultado = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0];

    return resultado ? resultado[0] : "Sin datos";
  }, [comprasFiltradas]);

  const limpiarFiltros = () => {
    setBuscar("");
    setFechaInicio("");
    setFechaFin("");
    setRegion("");
    setProveedor("");
    setEstado("");
    setCalidad("");
  };

  const exportarExcel = () => {
    downloadFile("/api/reportes/exportar-compras-excel/", "reporte_compras.xlsx");
  };

  const exportarPDF = () => {
    downloadFile("/api/reportes/exportar-compras-pdf/", "reporte_compras.pdf");
  };

  const verDetalle = (compra) => {
    alert(
      `Reporte: ${compra.codigo}\nProveedor: ${compra.proveedor_nombre}\nRegión: ${compra.region_nombre}\nTotal: ${formatoSoles(compra.total)}`
    );
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-[28px] font-bold leading-tight text-azul sm:text-[32px]">
            Panel de Reportes
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-textoSuave sm:text-base">
            Análisis detallado de recolección, compras, pagos e inventario de
            fibra de vicuña.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={exportarExcel}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <FileSpreadsheet size={19} />
            Exportar Excel
          </button>

          <button
            onClick={exportarPDF}
            className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700"
          >
            <FileText size={19} />
            Exportar PDF
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-borde bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gris">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gris" size={18} />
              <input
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                placeholder="Buscar reportes..."
                className="w-full rounded-lg border border-borde bg-azulSuave py-2.5 pl-10 pr-4 text-sm outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gris">
              Desde
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full rounded-lg border border-borde bg-azulSuave px-3 py-2.5 text-sm outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gris">
              Hasta
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full rounded-lg border border-borde bg-azulSuave px-3 py-2.5 text-sm outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gris">
              Región
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full rounded-lg border border-borde bg-azulSuave px-3 py-2.5 text-sm outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
            >
              <option value="">Todas las regiones</option>
              {regiones.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gris">
              Proveedor
            </label>
            <select
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
              className="w-full rounded-lg border border-borde bg-azulSuave px-3 py-2.5 text-sm outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
            >
              <option value="">Todos los proveedores</option>
              {proveedores.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gris">
              Estado
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full rounded-lg border border-borde bg-azulSuave px-3 py-2.5 text-sm outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
            >
              <option value="">Todos los estados</option>
              <option value="CONFIRMADA">Completado</option>
              <option value="BORRADOR">Pendiente</option>
              <option value="ANULADA">Anulado</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gris">
              Calidad
            </label>
            <select
              value={calidad}
              onChange={(e) => setCalidad(e.target.value)}
              className="w-full rounded-lg border border-borde bg-azulSuave px-3 py-2.5 text-sm outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
            >
              <option value="">Todas las calidades</option>
              <option value="PREMIUM_A1">Grado A</option>
              <option value="ESTANDAR">Grado B</option>
              <option value="CALIDAD_B">Grado C</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={limpiarFiltros}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-texto transition hover:bg-amber-500"
            >
              <FilterX size={18} />
              Limpiar filtros
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-borde bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="rounded-lg bg-azulClaro p-3 text-azul">
              <Scale size={25} />
            </div>
            <span className="text-sm font-bold text-green-700">+12.5%</span>
          </div>

          <div className="mt-5">
            <p className="text-sm font-semibold text-textoSuave">
              Total fibra recolectada
            </p>
            <h3 className="mt-1 text-2xl font-extrabold text-azul">
              {formatoKg(totalKg)}
            </h3>
          </div>
        </article>

        <article className="rounded-xl border border-borde bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="rounded-lg bg-moradoClaro p-3 text-morado">
              <Coins size={25} />
            </div>
            <span className="text-sm font-bold text-green-700">+8.2%</span>
          </div>

          <div className="mt-5">
            <p className="text-sm font-semibold text-textoSuave">
              Valor estimado
            </p>
            <h3 className="mt-1 text-2xl font-extrabold text-azul">
              {formatoSoles(valorTotal)}
            </h3>
          </div>
        </article>

        <article className="rounded-xl border border-borde bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="rounded-lg bg-azulSuave p-3 text-azul">
              <Award size={25} />
            </div>
            <span className="text-sm font-bold text-textoSuave">
              Stock: {formatoKg(stockDisponible)}
            </span>
          </div>

          <div className="mt-5">
            <p className="text-sm font-semibold text-textoSuave">
              Calidad predominante
            </p>
            <h3 className="mt-1 text-2xl font-extrabold text-azul">
              {calidadPromedio}
            </h3>
          </div>
        </article>

        <article className="rounded-xl border border-borde bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="rounded-lg bg-rojoClaro p-3 text-rojo">
              <Truck size={25} />
            </div>
            <span className="text-sm font-bold text-rojo">
              Pagado: {formatoSoles(pagosProcesados)}
            </span>
          </div>

          <div className="mt-5">
            <p className="text-sm font-semibold text-textoSuave">
              Registros activos
            </p>
            <h3 className="mt-1 text-2xl font-extrabold text-azul">
              {enviosActivos}
            </h3>
          </div>
        </article>
      </section>

      {error && (
        <section className="rounded-xl border border-red-200 bg-white p-5">
          <p className="font-semibold text-rojo">{error}</p>
          <button
            onClick={cargarDatos}
            className="mt-4 flex items-center gap-2 rounded-lg bg-azul px-4 py-2 text-sm font-bold text-white"
          >
            <RefreshCw size={16} />
            Reintentar
          </button>
        </section>
      )}

      <section className="overflow-hidden rounded-xl border border-borde bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-borde p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-bold text-azul">
              Detalle de Resultados
            </h3>
            <p className="text-sm text-textoSuave">
              Reporte generado desde compras registradas en el sistema.
            </p>
          </div>

          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2 text-textoSuave">
              <span className="h-3 w-3 rounded-full bg-green-500" />
              Completado
            </div>
            <div className="flex items-center gap-2 text-textoSuave">
              <span className="h-3 w-3 rounded-full bg-amber-500" />
              Pendiente
            </div>
          </div>
        </div>

        <div className="custom-scrollbar overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
            <thead className="bg-azulSuave">
              <tr>
                <th className="px-6 py-4 font-bold text-textoSuave">
                  ID Reporte
                </th>
                <th className="px-6 py-4 font-bold text-textoSuave">
                  Fecha
                </th>
                <th className="px-6 py-4 font-bold text-textoSuave">
                  Proveedor
                </th>
                <th className="px-6 py-4 font-bold text-textoSuave">
                  Región
                </th>
                <th className="px-6 py-4 text-right font-bold text-textoSuave">
                  Peso
                </th>
                <th className="px-6 py-4 font-bold text-textoSuave">
                  Calidad
                </th>
                <th className="px-6 py-4 font-bold text-textoSuave">
                  Estado
                </th>
                <th className="px-6 py-4 text-center font-bold text-textoSuave">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-borde">
              {cargando ? (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center text-textoSuave">
                    Cargando reportes...
                  </td>
                </tr>
              ) : comprasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center text-textoSuave">
                    No se encontraron resultados.
                  </td>
                </tr>
              ) : (
                comprasFiltradas.map((compra) => {
                  const EstadoIcono =
                    estadosCompra[compra.estado]?.icono || Clock3;

                  return (
                    <tr
                      key={compra.id}
                      className="transition hover:bg-azulSuave/50"
                    >
                      <td className="px-6 py-5 font-bold text-azul">
                        REP-{compra.codigo || compra.id}
                      </td>

                      <td className="px-6 py-5 text-textoSuave">
                        {formatoFecha(compra.fecha_compra)}
                      </td>

                      <td className="px-6 py-5 font-semibold text-texto">
                        {compra.proveedor_nombre || "Sin proveedor"}
                      </td>

                      <td className="px-6 py-5 text-texto">
                        {compra.region_nombre || "Sin región"}
                      </td>

                      <td className="px-6 py-5 text-right font-bold text-texto">
                        {formatoKg(compra.kilogramos)}
                      </td>

                      <td className="px-6 py-5">
                        <span className="rounded-full bg-azulClaro px-3 py-1 text-xs font-bold uppercase text-azul">
                          {calidades[compra.calidad] ||
                            compra.calidad_texto ||
                            "Sin calidad"}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <div
                          className={`flex items-center gap-2 font-bold ${
                            estadosCompra[compra.estado]?.clase ||
                            "text-textoSuave"
                          }`}
                        >
                          <EstadoIcono size={18} />
                          {estadosCompra[compra.estado]?.texto ||
                            compra.estado}
                        </div>
                      </td>

                      <td className="px-6 py-5 text-center">
                        <button
                          onClick={() => verDetalle(compra)}
                          className="rounded-lg p-2 text-textoSuave hover:bg-azulSuave hover:text-azul"
                        >
                          <Eye size={20} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-borde bg-azulSuave px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-textoSuave">
            Mostrando {comprasFiltradas.length} de {compras.length} resultados
          </p>

          <div className="flex gap-2">
            <button className="rounded-lg border border-borde bg-white p-2 text-textoSuave">
              <ChevronLeft size={18} />
            </button>
            <button className="h-9 w-9 rounded-lg bg-azul text-sm font-bold text-white">
              1
            </button>
            <button className="h-9 w-9 rounded-lg border border-borde bg-white text-sm font-bold text-textoSuave">
              2
            </button>
            <button className="h-9 w-9 rounded-lg border border-borde bg-white text-sm font-bold text-textoSuave">
              3
            </button>
            <button className="rounded-lg border border-borde bg-white p-2 text-textoSuave">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Reportes;