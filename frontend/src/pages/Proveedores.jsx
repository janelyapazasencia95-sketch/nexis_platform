import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Download,
  Filter,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";
import api from "../services/api";

const estadoClase = {
  true: "bg-green-100 text-green-700 border-green-200",
  false: "bg-red-100 text-red-700 border-red-200",
};

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
  const [estado, setEstado] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);

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
      const textoBusqueda = `${proveedor.nombre || ""} ${proveedor.numero_documento || ""} ${proveedor.correo || ""}`.toLowerCase();

      const coincideBusqueda = textoBusqueda.includes(buscar.toLowerCase());

      const coincideRegion = region
        ? String(proveedor.region) === String(region)
        : true;

      const coincideEstado =
        estado === ""
          ? true
          : estado === "activo"
            ? proveedor.activo === true
            : proveedor.activo === false;

      return coincideBusqueda && coincideRegion && coincideEstado;
    });
  }, [proveedores, buscar, region, estado]);

  const totalActivos = proveedores.filter((item) => item.activo).length;
  const totalInactivos = proveedores.filter((item) => !item.activo).length;

  const limpiarFiltros = () => {
    setBuscar("");
    setRegion("");
    setEstado("");
  };

  const abrirModal = () => {
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

  const cambiarFormulario = (campo, valor) => {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  };

  const guardarProveedor = async (e) => {
    e.preventDefault();

    try {
      await api.post("/proveedores/", formulario);
      setModalAbierto(false);
      await cargarDatos();
    } catch (error) {
      console.error(error);
      alert("No se pudo registrar el proveedor. Revisa que el documento no esté repetido.");
    }
  };

  const exportarCSV = () => {
    const encabezados = [
      "Proveedor",
      "Tipo",
      "Documento",
      "Region",
      "Provincia",
      "Telefono",
      "Correo",
      "Estado",
    ];

    const filas = proveedoresFiltrados.map((proveedor) => [
      proveedor.nombre,
      tipoProveedorTexto[proveedor.tipo_proveedor] || proveedor.tipo_proveedor,
      `${proveedor.tipo_documento} ${proveedor.numero_documento}`,
      proveedor.region_nombre || "",
      proveedor.provincia_nombre || "",
      proveedor.telefono || "",
      proveedor.correo || "",
      proveedor.activo ? "Activo" : "Inactivo",
    ]);

    const contenido = [encabezados, ...filas]
      .map((fila) => fila.map((celda) => `"${celda || ""}"`).join(","))
      .join("\n");

    const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "proveedores_nexis.csv";
    enlace.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#c5c5d2] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#465aa3]">
              Gestión comercial
            </p>
            <h3 className="mt-1 text-2xl font-bold text-[#0b1c30]">
              Proveedores
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-[#454651]">
              Administra comunidades, asociaciones, cooperativas y proveedores individuales de fibra de vicuña.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={exportarCSV}
              className="flex items-center gap-2 rounded-lg border border-[#c5c5d2] bg-[#eff4ff] px-4 py-2 text-sm font-semibold text-[#253a82] hover:bg-[#dce9ff]"
            >
              <Download size={18} />
              Exportar
            </button>

            <button
              onClick={abrirModal}
              className="flex items-center gap-2 rounded-lg bg-[#253a82] px-4 py-2 text-sm font-semibold text-white hover:bg-[#07226b]"
            >
              <Plus size={18} />
              Nuevo proveedor
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[#c5c5d2] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#454651]">Total registrados</p>
              <h4 className="mt-1 text-3xl font-bold text-[#253a82]">
                {proveedores.length}
              </h4>
            </div>
            <div className="rounded-full bg-[#dce1ff] p-3 text-[#253a82]">
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#c5c5d2] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#454651]">Proveedores activos</p>
              <h4 className="mt-1 text-3xl font-bold text-green-700">
                {totalActivos}
              </h4>
            </div>
            <div className="rounded-full bg-green-100 p-3 text-green-700">
              <UserRound size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#c5c5d2] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#454651]">Inactivos</p>
              <h4 className="mt-1 text-3xl font-bold text-red-700">
                {totalInactivos}
              </h4>
            </div>
            <div className="rounded-full bg-red-100 p-3 text-red-700">
              <AlertCircle size={24} />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#c5c5d2] bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-3 text-[#757682]" size={18} />
            <input
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              placeholder="Buscar por nombre, documento o correo..."
              className="w-full rounded-lg border border-[#c5c5d2] bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#88a2ff] focus:ring-2 focus:ring-[#dce1ff]"
            />
          </div>

          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="rounded-lg border border-[#c5c5d2] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#88a2ff] focus:ring-2 focus:ring-[#dce1ff]"
          >
            <option value="">Todas las regiones</option>
            {regiones.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre}
              </option>
            ))}
          </select>

          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="rounded-lg border border-[#c5c5d2] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#88a2ff] focus:ring-2 focus:ring-[#dce1ff]"
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm text-[#454651]">
            <Filter size={16} />
            Mostrando {proveedoresFiltrados.length} de {proveedores.length} proveedores
          </p>

          <button
            onClick={limpiarFiltros}
            className="flex items-center gap-2 rounded-lg border border-[#c5c5d2] px-3 py-2 text-sm text-[#454651] hover:bg-[#eff4ff]"
          >
            <RefreshCw size={16} />
            Limpiar filtros
          </button>
        </div>
      </section>

      {error && (
        <section className="flex items-center gap-3 rounded-2xl border border-red-200 bg-white p-5 text-red-600">
          <AlertCircle size={22} />
          <p>{error}</p>
        </section>
      )}

      <section className="rounded-2xl border border-[#c5c5d2] bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h4 className="text-lg font-bold text-[#0b1c30]">
              Lista de proveedores
            </h4>
            <p className="text-sm text-[#454651]">
              Información de contacto, ubicación y estado operativo.
            </p>
          </div>

          <button
            onClick={cargarDatos}
            className="flex items-center gap-2 rounded-lg bg-[#eff4ff] px-3 py-2 text-sm font-semibold text-[#253a82] hover:bg-[#dce9ff]"
          >
            <RefreshCw size={16} />
            Actualizar
          </button>
        </div>

        {cargando ? (
          <p className="py-8 text-center text-[#454651]">
            Cargando proveedores...
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-sm">
              <thead>
                <tr className="bg-[#eff4ff] text-left text-[#454651]">
                  <th className="rounded-l-lg px-4 py-3">Proveedor</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Documento</th>
                  <th className="px-4 py-3">Ubicación</th>
                  <th className="px-4 py-3">Contacto</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="rounded-r-lg px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {proveedoresFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-10 text-center text-[#454651]">
                      No se encontraron proveedores.
                    </td>
                  </tr>
                ) : (
                  proveedoresFiltrados.map((proveedor) => (
                    <tr
                      key={proveedor.id}
                      className="border-b border-[#e5eeff] hover:bg-[#f8f9ff]"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dce1ff] font-bold text-[#253a82]">
                            {proveedor.nombre?.charAt(0) || "P"}
                          </div>
                          <div>
                            <p className="font-semibold text-[#0b1c30]">
                              {proveedor.nombre}
                            </p>
                            <p className="text-xs text-[#454651]">
                              Registrado en NEXIS
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        {tipoProveedorTexto[proveedor.tipo_proveedor] ||
                          proveedor.tipo_proveedor ||
                          "Sin tipo"}
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-semibold text-[#0b1c30]">
                          {proveedor.tipo_documento}
                        </p>
                        <p className="text-xs text-[#454651]">
                          {proveedor.numero_documento}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <p className="flex items-center gap-2 font-semibold text-[#0b1c30]">
                          <MapPin size={15} className="text-[#253a82]" />
                          {proveedor.region_nombre || "Sin región"}
                        </p>
                        <p className="ml-6 text-xs text-[#454651]">
                          {proveedor.provincia_nombre || "Sin provincia"}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <p className="flex items-center gap-2 text-[#0b1c30]">
                          <Phone size={14} className="text-[#253a82]" />
                          {proveedor.telefono || "Sin teléfono"}
                        </p>
                        <p className="mt-1 flex items-center gap-2 text-xs text-[#454651]">
                          <Mail size={14} />
                          {proveedor.correo || "Sin correo"}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                            proveedor.activo
                              ? estadoClase.true
                              : estadoClase.false
                          }`}
                        >
                          {proveedor.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <button className="rounded-lg px-3 py-2 text-sm font-semibold text-[#253a82] hover:bg-[#eff4ff]">
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#0b1c30]">
                  Registrar nuevo proveedor
                </h3>
                <p className="text-sm text-[#454651]">
                  Completa los datos básicos del proveedor.
                </p>
              </div>

              <button
                onClick={() => setModalAbierto(false)}
                className="rounded-full p-2 hover:bg-[#eff4ff]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardarProveedor} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-[#0b1c30]">
                  Nombre del proveedor
                </label>
                <input
                  required
                  value={formulario.nombre}
                  onChange={(e) => cambiarFormulario("nombre", e.target.value)}
                  className="w-full rounded-lg border border-[#c5c5d2] px-4 py-2.5 outline-none focus:border-[#88a2ff] focus:ring-2 focus:ring-[#dce1ff]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#0b1c30]">
                  Tipo de proveedor
                </label>
                <select
                  value={formulario.tipo_proveedor}
                  onChange={(e) => cambiarFormulario("tipo_proveedor", e.target.value)}
                  className="w-full rounded-lg border border-[#c5c5d2] px-4 py-2.5 outline-none focus:border-[#88a2ff] focus:ring-2 focus:ring-[#dce1ff]"
                >
                  <option value="PERSONA">Persona natural</option>
                  <option value="COMUNIDAD">Comunidad</option>
                  <option value="ASOCIACION">Asociación</option>
                  <option value="COOPERATIVA">Cooperativa</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#0b1c30]">
                  Región
                </label>
                <select
                  required
                  value={formulario.region}
                  onChange={(e) => cambiarFormulario("region", e.target.value)}
                  className="w-full rounded-lg border border-[#c5c5d2] px-4 py-2.5 outline-none focus:border-[#88a2ff] focus:ring-2 focus:ring-[#dce1ff]"
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
                <label className="mb-1 block text-sm font-semibold text-[#0b1c30]">
                  Tipo documento
                </label>
                <select
                  value={formulario.tipo_documento}
                  onChange={(e) => cambiarFormulario("tipo_documento", e.target.value)}
                  className="w-full rounded-lg border border-[#c5c5d2] px-4 py-2.5 outline-none focus:border-[#88a2ff] focus:ring-2 focus:ring-[#dce1ff]"
                >
                  <option value="DNI">DNI</option>
                  <option value="RUC">RUC</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#0b1c30]">
                  Número documento
                </label>
                <input
                  required
                  value={formulario.numero_documento}
                  onChange={(e) => cambiarFormulario("numero_documento", e.target.value)}
                  className="w-full rounded-lg border border-[#c5c5d2] px-4 py-2.5 outline-none focus:border-[#88a2ff] focus:ring-2 focus:ring-[#dce1ff]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#0b1c30]">
                  Teléfono
                </label>
                <input
                  value={formulario.telefono}
                  onChange={(e) => cambiarFormulario("telefono", e.target.value)}
                  className="w-full rounded-lg border border-[#c5c5d2] px-4 py-2.5 outline-none focus:border-[#88a2ff] focus:ring-2 focus:ring-[#dce1ff]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#0b1c30]">
                  Correo
                </label>
                <input
                  type="email"
                  value={formulario.correo}
                  onChange={(e) => cambiarFormulario("correo", e.target.value)}
                  className="w-full rounded-lg border border-[#c5c5d2] px-4 py-2.5 outline-none focus:border-[#88a2ff] focus:ring-2 focus:ring-[#dce1ff]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-[#0b1c30]">
                  Dirección
                </label>
                <input
                  value={formulario.direccion}
                  onChange={(e) => cambiarFormulario("direccion", e.target.value)}
                  className="w-full rounded-lg border border-[#c5c5d2] px-4 py-2.5 outline-none focus:border-[#88a2ff] focus:ring-2 focus:ring-[#dce1ff]"
                />
              </div>

              <div className="mt-3 flex justify-end gap-3 md:col-span-2">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="rounded-lg border border-[#c5c5d2] px-4 py-2 text-sm font-semibold text-[#454651] hover:bg-[#eff4ff]"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-[#253a82] px-4 py-2 text-sm font-semibold text-white hover:bg-[#07226b]"
                >
                  Guardar proveedor
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