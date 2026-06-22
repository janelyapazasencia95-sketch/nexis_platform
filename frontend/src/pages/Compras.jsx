import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle,
  ClipboardList,
  Download,
  Edit,
  FilterX,
  PackageCheck,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import api from "../services/api";

const estados = {
  BORRADOR: {
    texto: "Borrador",
    clase: "bg-azulClaro text-azul2",
  },
  CONFIRMADA: {
    texto: "Confirmada",
    clase: "bg-green-100 text-green-800",
  },
  ANULADA: {
    texto: "Anulada",
    clase: "bg-rojoClaro text-rojo",
  },
};

const calidades = {
  PREMIUM_A1: "Premium A1",
  ESTANDAR: "Estándar",
  CALIDAD_B: "Calidad B",
};

function Compras() {
  const [compras, setCompras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [regiones, setRegiones] = useState([]);

  const [buscar, setBuscar] = useState("");
  const [estado, setEstado] = useState("TODOS");
  const [region, setRegion] = useState("");

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);

  const [formulario, setFormulario] = useState({
    proveedor: "",
    region: "",
    fecha_compra: "",
    kilogramos: "",
    precio_kg: "",
    calidad: "ESTANDAR",
    estado: "BORRADOR",
    observacion: "",
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

      const [respuestaCompras, respuestaProveedores, respuestaRegiones] =
        await Promise.all([
          api.get("/compras/"),
          api.get("/proveedores/"),
          api.get("/zonas/regiones/"),
        ]);

      setCompras(obtenerLista(respuestaCompras.data));
      setProveedores(obtenerLista(respuestaProveedores.data));
      setRegiones(obtenerLista(respuestaRegiones.data));
    } catch (error) {
      console.error(error);
      setError("No se pudo cargar la información de compras.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

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

      const coincideEstado =
        estado === "TODOS" ? true : compra.estado === estado;

      const coincideRegion = region
        ? String(compra.region) === String(region)
        : true;

      return coincideBusqueda && coincideEstado && coincideRegion;
    });
  }, [compras, buscar, estado, region]);

  const totalKg = compras
    .filter((item) => item.estado === "CONFIRMADA")
    .reduce((suma, item) => suma + Number(item.kilogramos || 0), 0);

  const totalMonto = compras
    .filter((item) => item.estado === "CONFIRMADA")
    .reduce((suma, item) => suma + Number(item.total || 0), 0);

  const totalBorradores = compras.filter(
    (item) => item.estado === "BORRADOR"
  ).length;

  const totalConfirmadas = compras.filter(
    (item) => item.estado === "CONFIRMADA"
  ).length;

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

  const calcularTotalFormulario = () => {
    const kg = Number(formulario.kilogramos || 0);
    const precio = Number(formulario.precio_kg || 0);
    return kg * precio;
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

  const abrirNuevo = () => {
    setEditando(null);
    setFormulario({
      proveedor: proveedores[0]?.id || "",
      region: regiones[0]?.id || "",
      fecha_compra: new Date().toISOString().slice(0, 10),
      kilogramos: "",
      precio_kg: "",
      calidad: "ESTANDAR",
      estado: "BORRADOR",
      observacion: "",
    });
    setModalAbierto(true);
  };

  const abrirEditar = (compra) => {
    setEditando(compra);
    setFormulario({
      proveedor: compra.proveedor || "",
      region: compra.region || "",
      fecha_compra: compra.fecha_compra || "",
      kilogramos: compra.kilogramos || "",
      precio_kg: compra.precio_kg || "",
      calidad: compra.calidad || "ESTANDAR",
      estado: compra.estado || "BORRADOR",
      observacion: compra.observacion || "",
    });
    setModalAbierto(true);
  };

  const guardarCompra = async (e) => {
    e.preventDefault();

    const datos = {
      ...formulario,
      kilogramos: Number(formulario.kilogramos),
      precio_kg: Number(formulario.precio_kg),
    };

    try {
      if (editando) {
        await api.patch(`/compras/${editando.id}/`, datos);
      } else {
        await api.post("/compras/", datos);
      }

      setModalAbierto(false);
      setEditando(null);
      await cargarDatos();
    } catch (error) {
      console.error(error);
      alert("No se pudo guardar la compra. Revisa los campos obligatorios.");
    }
  };

  const confirmarCompra = async (compra) => {
    const confirmar = window.confirm(
      `¿Confirmar la compra ${compra.codigo}? Esto generará un lote en inventario.`
    );

    if (!confirmar) return;

    try {
      await api.post(`/compras/${compra.id}/confirmar/`);
      await cargarDatos();
    } catch (error) {
      console.error(error);
      alert("No se pudo confirmar la compra.");
    }
  };

  const anularCompra = async (compra) => {
    const confirmar = window.confirm(`¿Anular la compra ${compra.codigo}?`);

    if (!confirmar) return;

    try {
      await api.post(`/compras/${compra.id}/anular/`);
      await cargarDatos();
    } catch (error) {
      console.error(error);
      alert("No se pudo anular la compra. Si tiene pagos, no se puede anular.");
    }
  };

  const exportarCSV = () => {
    const encabezados = [
      "Código",
      "Fecha",
      "Proveedor",
      "Región",
      "Kg",
      "Precio por kg",
      "Total",
      "Calidad",
      "Estado",
    ];

    const filas = comprasFiltradas.map((compra) => [
      compra.codigo,
      compra.fecha_compra,
      compra.proveedor_nombre,
      compra.region_nombre,
      compra.kilogramos,
      compra.precio_kg,
      compra.total,
      compra.calidad_texto,
      estados[compra.estado]?.texto || compra.estado,
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
    enlace.download = "compras_nexis.csv";
    enlace.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-[28px] font-bold leading-tight text-azul sm:text-[32px]">
            Registro de Compras
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-textoSuave sm:text-base">
            Registra compras de fibra de vicuña, controla estados y confirma
            operaciones para generar lotes de inventario.
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
            onClick={abrirNuevo}
            className="flex items-center justify-center gap-2 rounded-lg bg-azul px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-azul2"
          >
            <Plus size={19} />
            Nueva compra
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-borde bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-textoSuave">
                Compras registradas
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-azul">
                {compras.length}
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-azulClaro text-azul2">
              <ClipboardList size={26} />
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-borde bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-textoSuave">
                Total confirmado
              </p>
              <h3 className="mt-2 text-2xl font-extrabold text-green-700">
                {formatoKg(totalKg)}
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <PackageCheck size={26} />
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-borde bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-textoSuave">
                Valor comprado
              </p>
              <h3 className="mt-2 text-2xl font-extrabold text-azul">
                {formatoSoles(totalMonto)}
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-moradoClaro text-morado">
              <ShoppingCart size={26} />
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-borde bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-textoSuave">
                Pendientes
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-rojo">
                {totalBorradores}
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
              placeholder="Buscar por código, proveedor, región o calidad..."
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
              <option value="BORRADOR">Borrador</option>
              <option value="CONFIRMADA">Confirmada</option>
              <option value="ANULADA">Anulada</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-textoSuave">
            Mostrando{" "}
            <span className="font-bold text-azul">
              {comprasFiltradas.length}
            </span>{" "}
            de {compras.length} compras
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

          <button
            onClick={cargarDatos}
            className="mt-4 flex items-center gap-2 rounded-lg bg-azul2 px-4 py-2 text-sm font-bold text-white"
          >
            <RefreshCw size={16} />
            Reintentar
          </button>
        </section>
      )}

      <section className="overflow-hidden rounded-xl border border-borde bg-white shadow-sm">
        <div className="custom-scrollbar overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
            <thead className="border-b border-borde bg-azulSuave text-textoSuave">
              <tr>
                <th className="px-6 py-4 font-bold">Código</th>
                <th className="px-6 py-4 font-bold">Proveedor</th>
                <th className="px-6 py-4 font-bold">Fecha</th>
                <th className="px-6 py-4 font-bold">Región</th>
                <th className="px-6 py-4 font-bold">Kg</th>
                <th className="px-6 py-4 font-bold">Precio/kg</th>
                <th className="px-6 py-4 font-bold">Total</th>
                <th className="px-6 py-4 text-center font-bold">Estado</th>
                <th className="px-6 py-4 text-right font-bold">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-borde/70">
              {cargando ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-6 py-10 text-center text-textoSuave"
                  >
                    Cargando compras...
                  </td>
                </tr>
              ) : comprasFiltradas.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-6 py-10 text-center text-textoSuave"
                  >
                    No se encontraron compras.
                  </td>
                </tr>
              ) : (
                comprasFiltradas.map((compra) => (
                  <tr
                    key={compra.id}
                    className="transition hover:bg-azulSuave/50"
                  >
                    <td className="px-6 py-5">
                      <p className="font-bold text-azul">{compra.codigo}</p>
                      <p className="mt-1 text-xs text-textoSuave">
                        {compra.calidad_texto || calidades[compra.calidad]}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <p className="font-semibold text-texto">
                        {compra.proveedor_nombre}
                      </p>
                    </td>

                    <td className="px-6 py-5 text-textoSuave">
                      {compra.fecha_compra}
                    </td>

                    <td className="px-6 py-5">
                      <span className="rounded-full bg-moradoClaro px-3 py-1 text-xs font-bold text-morado">
                        {compra.region_nombre}
                      </span>
                    </td>

                    <td className="px-6 py-5 font-bold text-texto">
                      {formatoKg(compra.kilogramos)}
                    </td>

                    <td className="px-6 py-5 text-textoSuave">
                      {formatoSoles(compra.precio_kg)}
                    </td>

                    <td className="px-6 py-5 font-bold text-azul">
                      {formatoSoles(compra.total)}
                    </td>

                    <td className="px-6 py-5 text-center">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide ${
                          estados[compra.estado]?.clase ||
                          "bg-azulClaro text-azul2"
                        }`}
                      >
                        {estados[compra.estado]?.texto || compra.estado}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => abrirEditar(compra)}
                          className="rounded-lg p-2 text-amber-600 transition hover:bg-amber-50"
                          title="Editar"
                          disabled={compra.estado === "CONFIRMADA"}
                        >
                          <Edit size={20} />
                        </button>

                        {compra.estado === "BORRADOR" && (
                          <button
                            onClick={() => confirmarCompra(compra)}
                            className="rounded-lg p-2 text-green-700 transition hover:bg-green-50"
                            title="Confirmar"
                          >
                            <CheckCircle size={20} />
                          </button>
                        )}

                        {compra.estado !== "ANULADA" && (
                          <button
                            onClick={() => anularCompra(compra)}
                            className="rounded-lg p-2 text-rojo transition hover:bg-rojoClaro/40"
                            title="Anular"
                          >
                            <Ban size={20} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 bg-azulSuave px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-textoSuave">
            Confirmadas: {totalConfirmadas} | Pendientes: {totalBorradores}
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

      {modalAbierto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
          <div className="custom-scrollbar max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-azul">
                  {editando ? "Editar compra" : "Registrar nueva compra"}
                </h3>
                <p className="mt-1 text-sm text-textoSuave">
                  Completa los datos de compra de fibra de vicuña.
                </p>
              </div>

              <button
                onClick={() => setModalAbierto(false)}
                className="rounded-lg p-2 text-textoSuave hover:bg-azulSuave"
              >
                <X size={22} />
              </button>
            </div>

            <form
              onSubmit={guardarCompra}
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              <div>
                <label className="mb-1 block text-sm font-bold text-texto">
                  Proveedor
                </label>
                <select
                  required
                  value={formulario.proveedor}
                  onChange={(e) =>
                    cambiarFormulario("proveedor", e.target.value)
                  }
                  className="w-full rounded-lg border border-borde px-4 py-3 outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
                >
                  <option value="">Seleccionar proveedor</option>
                  {proveedores.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-texto">
                  Región
                </label>
                <select
                  required
                  value={formulario.region}
                  onChange={(e) => cambiarFormulario("region", e.target.value)}
                  className="w-full rounded-lg border border-borde px-4 py-3 outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
                >
                  <option value="">Seleccionar región</option>
                  {regiones.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-texto">
                  Fecha de compra
                </label>
                <input
                  required
                  type="date"
                  value={formulario.fecha_compra}
                  onChange={(e) =>
                    cambiarFormulario("fecha_compra", e.target.value)
                  }
                  className="w-full rounded-lg border border-borde px-4 py-3 outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-texto">
                  Calidad
                </label>
                <select
                  value={formulario.calidad}
                  onChange={(e) =>
                    cambiarFormulario("calidad", e.target.value)
                  }
                  className="w-full rounded-lg border border-borde px-4 py-3 outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
                >
                  <option value="PREMIUM_A1">Premium A1</option>
                  <option value="ESTANDAR">Estándar</option>
                  <option value="CALIDAD_B">Calidad B</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-texto">
                  Kilogramos
                </label>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formulario.kilogramos}
                  onChange={(e) =>
                    cambiarFormulario("kilogramos", e.target.value)
                  }
                  className="w-full rounded-lg border border-borde px-4 py-3 outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-texto">
                  Precio por kg
                </label>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formulario.precio_kg}
                  onChange={(e) =>
                    cambiarFormulario("precio_kg", e.target.value)
                  }
                  className="w-full rounded-lg border border-borde px-4 py-3 outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-texto">
                  Estado
                </label>
                <select
                  value={formulario.estado}
                  onChange={(e) => cambiarFormulario("estado", e.target.value)}
                  className="w-full rounded-lg border border-borde px-4 py-3 outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
                >
                  <option value="BORRADOR">Borrador</option>
                  <option value="CONFIRMADA">Confirmada</option>
                  <option value="ANULADA">Anulada</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-texto">
                  Total estimado
                </label>
                <div className="rounded-lg border border-borde bg-azulSuave px-4 py-3 font-bold text-azul">
                  {formatoSoles(calcularTotalFormulario())}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-bold text-texto">
                  Observación
                </label>
                <textarea
                  rows="3"
                  value={formulario.observacion}
                  onChange={(e) =>
                    cambiarFormulario("observacion", e.target.value)
                  }
                  className="w-full rounded-lg border border-borde px-4 py-3 outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
                />
              </div>

              <div className="mt-3 flex flex-col gap-3 md:col-span-2 sm:flex-row sm:justify-end">
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
                  {editando ? "Guardar cambios" : "Guardar compra"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Compras;