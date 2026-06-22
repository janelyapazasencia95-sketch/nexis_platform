import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  ArrowDownCircle,
  ArrowUpCircle,
  ClipboardList,
  Download,
  FilterX,
  Package,
  Plus,
  RefreshCw,
  Save,
  Search,
  SlidersHorizontal,
  Warehouse,
  X,
} from "lucide-react";
import api from "../services/api";

const estados = {
  DISPONIBLE: {
    texto: "Disponible",
    clase: "bg-green-100 text-green-800",
  },
  RESERVADO: {
    texto: "Reservado",
    clase: "bg-azulClaro text-azul2",
  },
  AGOTADO: {
    texto: "Agotado",
    clase: "bg-rojoClaro text-rojo",
  },
};

const tiposMovimiento = {
  ENTRADA: {
    texto: "Entrada",
    icono: ArrowUpCircle,
    clase: "text-green-700",
  },
  SALIDA: {
    texto: "Salida",
    icono: ArrowDownCircle,
    clase: "text-rojo",
  },
  AJUSTE: {
    texto: "Ajuste",
    icono: SlidersHorizontal,
    clase: "text-azul2",
  },
};

function Inventario() {
  const [lotes, setLotes] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [regiones, setRegiones] = useState([]);

  const [buscar, setBuscar] = useState("");
  const [estado, setEstado] = useState("TODOS");
  const [region, setRegion] = useState("");

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [loteSeleccionado, setLoteSeleccionado] = useState(null);

  const [formulario, setFormulario] = useState({
    tipo: "SALIDA",
    cantidad_kg: "",
    motivo: "",
  });

  const obtenerLista = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.results)) return data.results;
    return [];
  };

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError("");

      const [respuestaLotes, respuestaMovimientos, respuestaRegiones] =
        await Promise.all([
          api.get("/inventario/lotes/"),
          api.get("/inventario/movimientos/"),
          api.get("/zonas/regiones/"),
        ]);

      setLotes(obtenerLista(respuestaLotes.data));
      setMovimientos(obtenerLista(respuestaMovimientos.data));
      setRegiones(obtenerLista(respuestaRegiones.data));
    } catch (error) {
      console.error(error);
      setError("No se pudo cargar la información de inventario.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const lotesFiltrados = useMemo(() => {
    return lotes.filter((lote) => {
      const texto = `
        ${lote.codigo || ""}
        ${lote.compra_codigo || ""}
        ${lote.proveedor_nombre || ""}
        ${lote.region_nombre || ""}
        ${lote.calidad || ""}
        ${lote.ubicacion || ""}
      `.toLowerCase();

      const coincideBusqueda = texto.includes(buscar.toLowerCase());

      const coincideEstado =
        estado === "TODOS" ? true : lote.estado === estado;

      const coincideRegion = region
        ? String(lote.region) === String(region)
        : true;

      return coincideBusqueda && coincideEstado && coincideRegion;
    });
  }, [lotes, buscar, estado, region]);

  const stockTotal = lotes.reduce(
    (suma, lote) => suma + Number(lote.kg_actual || 0),
    0
  );

  const stockInicial = lotes.reduce(
    (suma, lote) => suma + Number(lote.kg_inicial || 0),
    0
  );

  const lotesDisponibles = lotes.filter(
    (lote) => lote.estado === "DISPONIBLE"
  ).length;

  const lotesAgotados = lotes.filter(
    (lote) => lote.estado === "AGOTADO"
  ).length;

  const lotesBajoStock = lotes.filter(
    (lote) => Number(lote.kg_actual || 0) <= 50 && lote.estado !== "AGOTADO"
  ).length;

  const movimientosRecientes = movimientos.slice(0, 6);

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

  const porcentajeStock = (lote) => {
    const inicial = Number(lote.kg_inicial || 0);
    const actual = Number(lote.kg_actual || 0);

    if (inicial <= 0) return 0;

    const porcentaje = Math.round((actual / inicial) * 100);
    return Math.max(0, Math.min(100, porcentaje));
  };

  const limpiarFiltros = () => {
    setBuscar("");
    setEstado("TODOS");
    setRegion("");
  };

  const cambiarFormulario = (campo, valor) => {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  };

  const abrirMovimiento = (lote) => {
    setLoteSeleccionado(lote);
    setFormulario({
      tipo: "SALIDA",
      cantidad_kg: "",
      motivo: "",
    });
    setModalAbierto(true);
  };

  const guardarMovimiento = async (e) => {
    e.preventDefault();

    if (!loteSeleccionado) return;

    const cantidad = Number(formulario.cantidad_kg || 0);
    const kgActual = Number(loteSeleccionado.kg_actual || 0);

    if (cantidad <= 0) {
      alert("La cantidad debe ser mayor a 0.");
      return;
    }

    let nuevoKg = kgActual;

    if (formulario.tipo === "ENTRADA") {
      nuevoKg = kgActual + cantidad;
    }

    if (formulario.tipo === "SALIDA") {
      nuevoKg = kgActual - cantidad;

      if (nuevoKg < 0) {
        alert("No se puede registrar una salida mayor al stock actual.");
        return;
      }
    }

    if (formulario.tipo === "AJUSTE") {
      nuevoKg = cantidad;
    }

    const nuevoEstado = nuevoKg <= 0 ? "AGOTADO" : "DISPONIBLE";

    try {
      await api.patch(`/inventario/lotes/${loteSeleccionado.id}/`, {
        kg_actual: nuevoKg,
        estado: nuevoEstado,
      });

      await api.post("/inventario/movimientos/", {
        lote: loteSeleccionado.id,
        tipo: formulario.tipo,
        cantidad_kg: cantidad,
        motivo:
          formulario.motivo ||
          `${tiposMovimiento[formulario.tipo].texto} registrada desde NEXIS`,
      });

      setModalAbierto(false);
      setLoteSeleccionado(null);
      await cargarDatos();
    } catch (error) {
      console.error(error);
      alert("No se pudo registrar el movimiento de inventario.");
    }
  };

  const exportarCSV = () => {
    const encabezados = [
      "Código lote",
      "Compra",
      "Proveedor",
      "Región",
      "Calidad",
      "Kg inicial",
      "Kg actual",
      "Ubicación",
      "Estado",
    ];

    const filas = lotesFiltrados.map((lote) => [
      lote.codigo,
      lote.compra_codigo,
      lote.proveedor_nombre,
      lote.region_nombre,
      lote.calidad,
      lote.kg_inicial,
      lote.kg_actual,
      lote.ubicacion,
      estados[lote.estado]?.texto || lote.estado,
    ]);

    const contenido = [encabezados, ...filas]
      .map((fila) => fila.map((celda) => `"${celda || ""}"`).join(","))
      .join("\n");

    const blob = new Blob([contenido], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "inventario_nexis.csv";
    enlace.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-[28px] font-bold leading-tight text-azul sm:text-[32px]">
            Inventario
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-textoSuave sm:text-base">
            Controla los lotes de fibra generados desde compras confirmadas,
            sus ubicaciones, stock actual y movimientos.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:w-auto">
          <button
            onClick={exportarCSV}
            className="flex items-center justify-center gap-2 rounded-lg bg-azulClaro px-5 py-3 text-sm font-bold text-azul2 transition hover:bg-borde"
          >
            <Download size={19} />
            Exportar
          </button>

          <button
            onClick={cargarDatos}
            className="flex items-center justify-center gap-2 rounded-lg bg-azul px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-azul2"
          >
            <RefreshCw size={19} />
            Actualizar
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-borde bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-textoSuave">
                Stock actual
              </p>
              <h3 className="mt-2 text-2xl font-extrabold text-azul">
                {formatoKg(stockTotal)}
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-azulClaro text-azul2">
              <Warehouse size={26} />
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-borde bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-textoSuave">
                Stock inicial
              </p>
              <h3 className="mt-2 text-2xl font-extrabold text-green-700">
                {formatoKg(stockInicial)}
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <Archive size={26} />
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-borde bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-textoSuave">
                Lotes disponibles
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-azul">
                {lotesDisponibles}
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-moradoClaro text-morado">
              <Package size={26} />
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-borde bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-textoSuave">
                Alertas de stock
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-rojo">
                {lotesBajoStock + lotesAgotados}
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rojoClaro text-rojo">
              <AlertTriangle size={26} />
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-xl border border-borde bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-3 text-gris" size={18} />
            <input
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              placeholder="Buscar por lote, compra, proveedor, región o calidad..."
              className="w-full rounded-lg border border-borde bg-azulSuave py-2.5 pl-10 pr-4 text-sm outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gris">
              Región
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full rounded-lg border border-borde bg-azulSuave px-4 py-2.5 text-sm outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
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
              Estado
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full rounded-lg border border-borde bg-azulSuave px-4 py-2.5 text-sm outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
            >
              <option value="TODOS">Todos</option>
              <option value="DISPONIBLE">Disponible</option>
              <option value="RESERVADO">Reservado</option>
              <option value="AGOTADO">Agotado</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-textoSuave">
            Mostrando{" "}
            <span className="font-bold text-azul">{lotesFiltrados.length}</span>{" "}
            de {lotes.length} lotes
          </p>

          <button
            onClick={limpiarFiltros}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-borde px-4 py-2 text-sm font-bold text-azul2 hover:bg-azulSuave sm:w-auto"
          >
            <FilterX size={17} />
            Limpiar filtros
          </button>
        </div>
      </section>

      {error && (
        <section className="rounded-xl border border-red-200 bg-white p-5">
          <div className="flex items-center gap-3 text-rojo">
            <AlertTriangle size={22} />
            <p className="font-semibold">{error}</p>
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-xl border border-borde bg-white shadow-sm">
        <div className="custom-scrollbar overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
            <thead className="border-b border-borde bg-azulSuave text-textoSuave">
              <tr>
                <th className="px-6 py-4 font-bold">Lote</th>
                <th className="px-6 py-4 font-bold">Proveedor</th>
                <th className="px-6 py-4 font-bold">Región</th>
                <th className="px-6 py-4 font-bold">Calidad</th>
                <th className="px-6 py-4 font-bold">Stock inicial</th>
                <th className="px-6 py-4 font-bold">Stock actual</th>
                <th className="px-6 py-4 font-bold">Ubicación</th>
                <th className="px-6 py-4 text-center font-bold">Estado</th>
                <th className="px-6 py-4 text-right font-bold">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-borde/70">
              {cargando ? (
                <tr>
                  <td colSpan="9" className="px-6 py-10 text-center text-textoSuave">
                    Cargando inventario...
                  </td>
                </tr>
              ) : lotesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-10 text-center text-textoSuave">
                    No se encontraron lotes.
                  </td>
                </tr>
              ) : (
                lotesFiltrados.map((lote) => (
                  <tr key={lote.id} className="transition hover:bg-azulSuave/50">
                    <td className="px-6 py-5">
                      <p className="font-bold text-azul">{lote.codigo}</p>
                      <p className="mt-1 text-xs text-textoSuave">
                        Compra: {lote.compra_codigo}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <p className="font-semibold text-texto">
                        {lote.proveedor_nombre || "Sin proveedor"}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <span className="rounded-full bg-moradoClaro px-3 py-1 text-xs font-bold text-morado">
                        {lote.region_nombre}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-textoSuave">
                      {lote.calidad}
                    </td>

                    <td className="px-6 py-5 font-bold text-texto">
                      {formatoKg(lote.kg_inicial)}
                    </td>

                    <td className="px-6 py-5">
                      <p className="font-bold text-azul">
                        {formatoKg(lote.kg_actual)}
                      </p>

                      <div className="mt-2 h-2 w-32 rounded-full bg-azulSuave">
                        <div
                          className={`h-full rounded-full ${
                            porcentajeStock(lote) <= 25
                              ? "bg-rojo"
                              : porcentajeStock(lote) <= 50
                                ? "bg-amarillo"
                                : "bg-verde"
                          }`}
                          style={{ width: `${porcentajeStock(lote)}%` }}
                        />
                      </div>
                    </td>

                    <td className="px-6 py-5 text-textoSuave">
                      {lote.ubicacion}
                    </td>

                    <td className="px-6 py-5 text-center">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide ${
                          estados[lote.estado]?.clase ||
                          "bg-azulClaro text-azul2"
                        }`}
                      >
                        {estados[lote.estado]?.texto || lote.estado}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={() => abrirMovimiento(lote)}
                        className="inline-flex items-center gap-2 rounded-lg bg-azul px-4 py-2 text-sm font-bold text-white hover:bg-azul2"
                      >
                        <Plus size={17} />
                        Movimiento
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 bg-azulSuave px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-textoSuave">
            Stock actual: {formatoKg(stockTotal)} | Lotes agotados: {lotesAgotados}
          </p>

          <button
            onClick={cargarDatos}
            className="flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-azul2"
          >
            <RefreshCw size={16} />
            Actualizar
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-borde bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-azul">
              Movimientos recientes
            </h3>
            <p className="text-sm text-textoSuave">
              Últimas entradas, salidas y ajustes de inventario.
            </p>
          </div>

          <ClipboardList className="text-azul2" size={26} />
        </div>

        <div className="space-y-3">
          {movimientosRecientes.length === 0 ? (
            <p className="text-sm text-textoSuave">
              Todavía no hay movimientos registrados.
            </p>
          ) : (
            movimientosRecientes.map((movimiento) => {
              const TipoIcono =
                tiposMovimiento[movimiento.tipo]?.icono || SlidersHorizontal;

              return (
                <div
                  key={movimiento.id}
                  className="flex flex-col gap-3 rounded-lg border border-borde bg-azulSuave p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <TipoIcono
                      size={24}
                      className={
                        tiposMovimiento[movimiento.tipo]?.clase || "text-azul2"
                      }
                    />

                    <div>
                      <p className="font-bold text-texto">
                        {tiposMovimiento[movimiento.tipo]?.texto ||
                          movimiento.tipo}{" "}
                        - {movimiento.lote_codigo}
                      </p>
                      <p className="text-sm text-textoSuave">
                        {movimiento.motivo}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="font-bold text-azul">
                      {formatoKg(movimiento.cantidad_kg)}
                    </p>
                    <p className="text-xs text-textoSuave">
                      {formatoFecha(movimiento.fecha_movimiento)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {modalAbierto && loteSeleccionado && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-azul">
                  Registrar movimiento
                </h3>
                <p className="mt-1 text-sm text-textoSuave">
                  Lote {loteSeleccionado.codigo} | Stock actual:{" "}
                  {formatoKg(loteSeleccionado.kg_actual)}
                </p>
              </div>

              <button
                onClick={() => setModalAbierto(false)}
                className="rounded-lg p-2 text-textoSuave hover:bg-azulSuave"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={guardarMovimiento} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-bold text-texto">
                  Tipo de movimiento
                </label>
                <select
                  value={formulario.tipo}
                  onChange={(e) => cambiarFormulario("tipo", e.target.value)}
                  className="w-full rounded-lg border border-borde px-4 py-3 outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
                >
                  <option value="ENTRADA">Entrada</option>
                  <option value="SALIDA">Salida</option>
                  <option value="AJUSTE">Ajuste</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-texto">
                  {formulario.tipo === "AJUSTE"
                    ? "Nuevo stock final en kg"
                    : "Cantidad en kg"}
                </label>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formulario.cantidad_kg}
                  onChange={(e) =>
                    cambiarFormulario("cantidad_kg", e.target.value)
                  }
                  className="w-full rounded-lg border border-borde px-4 py-3 outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-texto">
                  Motivo
                </label>
                <textarea
                  rows="3"
                  value={formulario.motivo}
                  onChange={(e) => cambiarFormulario("motivo", e.target.value)}
                  placeholder="Ejemplo: salida para procesamiento, ajuste por revisión física..."
                  className="w-full rounded-lg border border-borde px-4 py-3 outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="rounded-lg border border-borde px-5 py-3 text-sm font-bold text-textoSuave hover:bg-azulSuave"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 rounded-lg bg-azul px-5 py-3 text-sm font-bold text-white hover:bg-azul2"
                >
                  <Save size={18} />
                  Guardar movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventario;