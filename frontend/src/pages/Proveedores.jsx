import { downloadFile } from "../services/download";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit,
  FilterX,
  Globe2,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import api from "../services/api";

const tipoProveedorTexto = {
  PERSONA: "Persona natural",
  COMUNIDAD: "Comunidad",
  ASOCIACION: "Asociación",
  COOPERATIVA: "Cooperativa",
};

function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [regiones, setRegiones] = useState([]);
  const [buscar, setBuscar] = useState("");
  const [region, setRegion] = useState("");
  const [estado, setEstado] = useState("TODOS");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);

  const [formulario, setFormulario] = useState({
    nombre: "",
    tipo_proveedor: "COMUNIDAD",
    tipo_documento: "RUC",
    numero_documento: "",
    region: "",
    telefono: "",
    correo: "",
    direccion: "",
    activo: true,
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

      const [respuestaProveedores, respuestaRegiones] = await Promise.all([
        api.get("/proveedores/"),
        api.get("/zonas/regiones/"),
      ]);

      setProveedores(obtenerLista(respuestaProveedores.data));
      setRegiones(obtenerLista(respuestaRegiones.data));
    } catch (error) {
      console.error(error);
      setError("No se pudo cargar la información de proveedores.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const proveedoresFiltrados = useMemo(() => {
    return proveedores.filter((proveedor) => {
      const texto = `
        ${proveedor.nombre || ""}
        ${proveedor.numero_documento || ""}
        ${proveedor.correo || ""}
        ${proveedor.telefono || ""}
        ${proveedor.region_nombre || ""}
        ${proveedor.comunidad_nombre || ""}
      `.toLowerCase();

      const coincideBusqueda = texto.includes(buscar.toLowerCase());

      const coincideRegion = region
        ? String(proveedor.region) === String(region)
        : true;

      const coincideEstado =
        estado === "TODOS"
          ? true
          : estado === "ACTIVOS"
            ? proveedor.activo === true
            : proveedor.activo === false;

      return coincideBusqueda && coincideRegion && coincideEstado;
    });
  }, [proveedores, buscar, region, estado]);

  const totalActivos = proveedores.filter((proveedor) => proveedor.activo).length;
  const totalInactivos = proveedores.filter((proveedor) => !proveedor.activo).length;

  const regionTop = useMemo(() => {
    const conteo = {};

    proveedores.forEach((proveedor) => {
      const nombreRegion = proveedor.region_nombre || "Sin región";
      conteo[nombreRegion] = (conteo[nombreRegion] || 0) + 1;
    });

    return Object.entries(conteo)
      .map(([nombre, total]) => ({
        nombre,
        total,
        porcentaje:
          proveedores.length > 0
            ? Math.round((total / proveedores.length) * 100)
            : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 2);
  }, [proveedores]);

  const limpiarFiltros = () => {
    setBuscar("");
    setRegion("");
    setEstado("TODOS");
  };

  const iniciales = (nombre) => {
    if (!nombre) return "PR";

    const partes = nombre.trim().split(" ");

    if (partes.length === 1) {
      return partes[0].slice(0, 2).toUpperCase();
    }

    return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
  };

  const abrirNuevo = () => {
    setEditando(null);
    setFormulario({
      nombre: "",
      tipo_proveedor: "COMUNIDAD",
      tipo_documento: "RUC",
      numero_documento: "",
      region: regiones[0]?.id || "",
      telefono: "",
      correo: "",
      direccion: "",
      activo: true,
    });
    setModalAbierto(true);
  };

  const abrirEditar = (proveedor) => {
    setEditando(proveedor);
    setFormulario({
      nombre: proveedor.nombre || "",
      tipo_proveedor: proveedor.tipo_proveedor || "COMUNIDAD",
      tipo_documento: proveedor.tipo_documento || "RUC",
      numero_documento: proveedor.numero_documento || "",
      region: proveedor.region || "",
      telefono: proveedor.telefono || "",
      correo: proveedor.correo || "",
      direccion: proveedor.direccion || "",
      activo: proveedor.activo,
    });
    setModalAbierto(true);
  };

  const cambiarFormulario = (campo, valor) => {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  };

  const guardarProveedor = async (e) => {
    e.preventDefault();

    try {
      if (editando) {
        await api.patch(`/proveedores/${editando.id}/`, formulario);
      } else {
        await api.post("/proveedores/", formulario);
      }

      setModalAbierto(false);
      setEditando(null);
      await cargarDatos();
    } catch (error) {
      console.error(error);
      alert(
        "No se pudo guardar el proveedor. Revisa que el documento no esté repetido y que la región esté seleccionada."
      );
    }
  };

  const cambiarEstadoProveedor = async (proveedor) => {
    try {
      await api.patch(`/proveedores/${proveedor.id}/`, {
        activo: !proveedor.activo,
      });

      await cargarDatos();
    } catch (error) {
      console.error(error);
      alert("No se pudo cambiar el estado del proveedor.");
    }
  };

  const exportarPDF = () => {
    downloadFile("/api/reportes/exportar-proveedores-pdf/", "reporte_proveedores.pdf");
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-[28px] font-bold leading-tight text-azul sm:text-[32px]">
            Gestión de Proveedores
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-textoSuave sm:text-base">
            Administra comunidades, asociaciones, cooperativas y proveedores de fibra de vicuña.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:w-auto">
          <button
            onClick={exportarPDF}
            className="flex items-center justify-center gap-2 rounded-lg bg-azulClaro px-5 py-3 text-sm font-bold text-azul2 transition hover:bg-borde"
          >
            <Download size={19} />
            Exportar PDF
          </button>

          <button
            onClick={abrirNuevo}
            className="flex items-center justify-center gap-2 rounded-lg bg-azul px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-azul2"
          >
            <Plus size={19} />
            Nuevo proveedor
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <article className="rounded-xl border border-borde bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-textoSuave">
                Total registrados
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-azul">
                {proveedores.length}
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-azulClaro text-azul2">
              <Users size={26} />
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-borde bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-textoSuave">
                Proveedores activos
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-green-700">
                {totalActivos}
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <CheckCircle size={26} />
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-borde bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-textoSuave">
                Proveedores inactivos
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-rojo">
                {totalInactivos}
              </h3>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rojoClaro text-rojo">
              <Ban size={26} />
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
              placeholder="Buscar por nombre, RUC, DNI, teléfono o región..."
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
              <option value="ACTIVOS">Activos</option>
              <option value="INACTIVOS">Inactivos</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-textoSuave">
            Mostrando{" "}
            <span className="font-bold text-azul">
              {proveedoresFiltrados.length}
            </span>{" "}
            de {proveedores.length} proveedores
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
          <table className="w-full min-w-[1050px] border-collapse text-left text-sm">
            <thead className="border-b border-borde bg-azulSuave text-textoSuave">
              <tr>
                <th className="px-6 py-4 font-bold">Nombre / Razón social</th>
                <th className="px-6 py-4 font-bold">Documento</th>
                <th className="px-6 py-4 font-bold">Comunidad</th>
                <th className="px-6 py-4 font-bold">Región</th>
                <th className="px-6 py-4 font-bold">Teléfono</th>
                <th className="px-6 py-4 text-center font-bold">Estado</th>
                <th className="px-6 py-4 text-right font-bold">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-borde/70">
              {cargando ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-textoSuave">
                    Cargando proveedores...
                  </td>
                </tr>
              ) : proveedoresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-textoSuave">
                    No se encontraron proveedores.
                  </td>
                </tr>
              ) : (
                proveedoresFiltrados.map((proveedor, index) => (
                  <tr
                    key={proveedor.id}
                    className="transition hover:bg-azulSuave/50"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
                            index % 2 === 0
                              ? "bg-azulClaro text-azul2"
                              : "bg-azulSuave text-azul"
                          }`}
                        >
                          {iniciales(proveedor.nombre)}
                        </div>

                        <div>
                          <p className="font-bold text-azul">
                            {proveedor.nombre}
                          </p>
                          <p className="mt-0.5 text-xs text-textoSuave">
                            {tipoProveedorTexto[proveedor.tipo_proveedor] ||
                              proveedor.tipo_proveedor ||
                              "Sin tipo"}
                          </p>
                          {proveedor.correo && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-textoSuave">
                              <Mail size={13} />
                              {proveedor.correo}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5 text-textoSuave">
                      <p className="font-semibold text-texto">
                        {proveedor.tipo_documento || "DOC"}
                      </p>
                      <p>{proveedor.numero_documento || "Sin documento"}</p>
                    </td>

                    <td className="px-6 py-5 text-textoSuave">
                      {proveedor.comunidad_nombre || "Sin comunidad"}
                    </td>

                    <td className="px-6 py-5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-moradoClaro px-3 py-1 text-xs font-bold text-morado">
                        <MapPin size={13} />
                        {proveedor.region_nombre || "Sin región"}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-textoSuave">
                      <span className="inline-flex items-center gap-2">
                        <Phone size={15} />
                        {proveedor.telefono || "Sin teléfono"}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-center">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide ${
                          proveedor.activo
                            ? "bg-green-100 text-green-800"
                            : "bg-rojoClaro text-rojo"
                        }`}
                      >
                        {proveedor.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => abrirEditar(proveedor)}
                          className="rounded-lg p-2 text-amber-600 transition hover:bg-amber-50"
                          title="Editar"
                        >
                          <Edit size={20} />
                        </button>

                        <button
                          onClick={() => cambiarEstadoProveedor(proveedor)}
                          className={`rounded-lg p-2 transition ${
                            proveedor.activo
                              ? "text-rojo hover:bg-rojoClaro/40"
                              : "text-azul hover:bg-azulClaro"
                          }`}
                          title={proveedor.activo ? "Desactivar" : "Activar"}
                        >
                          {proveedor.activo ? (
                            <Ban size={20} />
                          ) : (
                            <CheckCircle size={20} />
                          )}
                        </button>
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
            Mostrando 1 a {proveedoresFiltrados.length} de{" "}
            {proveedoresFiltrados.length} proveedores
          </p>

          <div className="flex items-center gap-2">
            <button className="flex h-8 w-8 items-center justify-center rounded border border-borde text-textoSuave hover:bg-white">
              <ChevronLeft size={17} />
            </button>

            <button className="flex h-8 w-8 items-center justify-center rounded bg-azul text-sm font-bold text-white">
              1
            </button>

            <button className="flex h-8 w-8 items-center justify-center rounded border border-borde text-textoSuave hover:bg-white">
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <article className="rounded-xl bg-azul2 p-6 text-white shadow-sm">
          <div className="mb-5 flex items-start justify-between">
            <Users size={32} />
            <span className="rounded-full bg-azul/30 px-3 py-1 text-xs font-bold">
              Activos
            </span>
          </div>

          <p className="mb-1 text-xs font-bold uppercase tracking-wider opacity-80">
            Convenios registrados
          </p>

          <h3 className="text-2xl font-bold">{totalActivos} proveedores</h3>

          <p className="mt-4 text-sm opacity-90">
            Cobertura activa para el abastecimiento de fibra de vicuña.
          </p>
        </article>

        <article className="relative overflow-hidden rounded-xl border border-borde bg-white p-6 shadow-sm">
          <div className="relative z-10">
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-gris">
              Distribución geográfica
            </p>

            <h3 className="mb-5 text-2xl font-bold text-azul">
              Top regiones
            </h3>

            <div className="space-y-4">
              {regionTop.length === 0 ? (
                <p className="text-sm text-textoSuave">Sin datos.</p>
              ) : (
                regionTop.map((item) => (
                  <div key={item.nombre}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-bold text-texto">{item.nombre}</span>
                      <span className="font-bold text-azul">
                        {item.porcentaje}%
                      </span>
                    </div>

                    <div className="h-2 w-full rounded-full bg-azulSuave">
                      <div
                        className="h-full rounded-full bg-azul2"
                        style={{ width: `${item.porcentaje}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <Globe2 className="absolute -bottom-6 -right-5 h-28 w-28 text-azulClaro" />
        </article>

        <article className="rounded-xl border border-borde bg-white p-6 shadow-sm">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-gris">
            Certificaciones
          </p>

          <h3 className="mb-5 text-2xl font-bold text-azul">
            Cumplimiento
          </h3>

          <div className="flex items-center gap-5">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-green-700" size={22} />
                <span className="text-sm font-semibold">
                  Control documentario
                </span>
              </div>

              <div className="flex items-center gap-2">
                <BadgeCheck className="text-green-700" size={22} />
                <span className="text-sm font-semibold">
                  Registro vigente
                </span>
              </div>
            </div>

            <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-azulClaro border-t-azul2">
              <span className="text-lg font-bold text-azul">88%</span>
            </div>
          </div>

          <p className="mt-5 text-sm text-textoSuave">
            Proveedores con información principal registrada dentro del sistema.
          </p>
        </article>
      </section>

      {modalAbierto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
          <div className="custom-scrollbar max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-azul">
                  {editando ? "Editar proveedor" : "Nuevo proveedor"}
                </h3>
                <p className="mt-1 text-sm text-textoSuave">
                  Completa los datos del proveedor de fibra.
                </p>
              </div>

              <button
                onClick={() => setModalAbierto(false)}
                className="rounded-lg p-2 text-textoSuave hover:bg-azulSuave"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={guardarProveedor} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-bold text-texto">
                  Nombre / Razón social
                </label>
                <input
                  required
                  value={formulario.nombre}
                  onChange={(e) => cambiarFormulario("nombre", e.target.value)}
                  className="w-full rounded-lg border border-borde px-4 py-3 outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-texto">
                  Tipo proveedor
                </label>
                <select
                  value={formulario.tipo_proveedor}
                  onChange={(e) =>
                    cambiarFormulario("tipo_proveedor", e.target.value)
                  }
                  className="w-full rounded-lg border border-borde px-4 py-3 outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
                >
                  <option value="PERSONA">Persona natural</option>
                  <option value="COMUNIDAD">Comunidad</option>
                  <option value="ASOCIACION">Asociación</option>
                  <option value="COOPERATIVA">Cooperativa</option>
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
                  Tipo documento
                </label>
                <select
                  value={formulario.tipo_documento}
                  onChange={(e) =>
                    cambiarFormulario("tipo_documento", e.target.value)
                  }
                  className="w-full rounded-lg border border-borde px-4 py-3 outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
                >
                  <option value="RUC">RUC</option>
                  <option value="DNI">DNI</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-texto">
                  Número documento
                </label>
                <input
                  required
                  value={formulario.numero_documento}
                  onChange={(e) =>
                    cambiarFormulario("numero_documento", e.target.value)
                  }
                  className="w-full rounded-lg border border-borde px-4 py-3 outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-texto">
                  Teléfono
                </label>
                <input
                  value={formulario.telefono}
                  onChange={(e) =>
                    cambiarFormulario("telefono", e.target.value)
                  }
                  className="w-full rounded-lg border border-borde px-4 py-3 outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-texto">
                  Correo
                </label>
                <input
                  type="email"
                  value={formulario.correo}
                  onChange={(e) => cambiarFormulario("correo", e.target.value)}
                  className="w-full rounded-lg border border-borde px-4 py-3 outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-bold text-texto">
                  Dirección
                </label>
                <input
                  value={formulario.direccion}
                  onChange={(e) =>
                    cambiarFormulario("direccion", e.target.value)
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
                  {editando ? "Guardar cambios" : "Guardar proveedor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Proveedores;