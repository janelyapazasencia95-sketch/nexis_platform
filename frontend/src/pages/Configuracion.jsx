import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle,
  Edit,
  Globe2,
  Layers,
  Plus,
  RefreshCw,
  Save,
  Settings,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import api from "../services/api";

function Configuracion() {
  const [configuracion, setConfiguracion] = useState({
    nombre_empresa: "",
    ruc: "",
    direccion: "",
    correo_notificaciones: "",
    telefono: "",
    moneda_base: "PEN",
    simbolo_moneda: "S/",
    tipo_cambio: "3.75",
    umbral_stock_bajo: "50",
    alerta_stock_activa: true,
  });

  const [calidades, setCalidades] = useState([]);
  const [estados, setEstados] = useState([]);
  const [regiones, setRegiones] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [modalCalidad, setModalCalidad] = useState(false);
  const [modalEstado, setModalEstado] = useState(false);

  const [calidadEditando, setCalidadEditando] = useState(null);
  const [estadoEditando, setEstadoEditando] = useState(null);

  const [formCalidad, setFormCalidad] = useState({
    nombre: "",
    descripcion: "",
    micraje_min: "",
    micraje_max: "",
    activo: true,
  });

  const [formEstado, setFormEstado] = useState({
    nombre: "",
    color: "#07226B",
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
      setMensaje("");

      const [respConfig, respCalidades, respEstados, respRegiones] =
        await Promise.all([
          api.get("/configuracion/actual/"),
          api.get("/configuracion/calidades/"),
          api.get("/configuracion/estados/"),
          api.get("/configuracion/regiones-activas/"),
        ]);

      setConfiguracion({
        nombre_empresa: respConfig.data.nombre_empresa || "",
        ruc: respConfig.data.ruc || "",
        direccion: respConfig.data.direccion || "",
        correo_notificaciones: respConfig.data.correo_notificaciones || "",
        telefono: respConfig.data.telefono || "",
        moneda_base: respConfig.data.moneda_base || "PEN",
        simbolo_moneda: respConfig.data.simbolo_moneda || "S/",
        tipo_cambio: respConfig.data.tipo_cambio || "3.75",
        umbral_stock_bajo: respConfig.data.umbral_stock_bajo || "50",
        alerta_stock_activa: respConfig.data.alerta_stock_activa ?? true,
      });

      setCalidades(obtenerLista(respCalidades.data));
      setEstados(obtenerLista(respEstados.data));
      setRegiones(obtenerLista(respRegiones.data));
    } catch (error) {
      console.error(error);
      setError("No se pudo cargar la configuración del sistema.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const cambiarConfig = (campo, valor) => {
    setConfiguracion((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  };

  const guardarConfiguracion = async (e) => {
    if (e) e.preventDefault();

    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      await api.patch("/configuracion/actualizar/", {
        ...configuracion,
        tipo_cambio: Number(configuracion.tipo_cambio || 0),
        umbral_stock_bajo: Number(configuracion.umbral_stock_bajo || 0),
      });

      setMensaje("Configuración guardada correctamente.");
      await cargarDatos();
    } catch (error) {
      console.error(error);
      setError("No se pudo guardar la configuración.");
    } finally {
      setGuardando(false);
    }
  };

  const abrirNuevaCalidad = () => {
    setCalidadEditando(null);
    setFormCalidad({
      nombre: "",
      descripcion: "",
      micraje_min: "",
      micraje_max: "",
      activo: true,
    });
    setModalCalidad(true);
  };

  const abrirEditarCalidad = (calidad) => {
    setCalidadEditando(calidad);
    setFormCalidad({
      nombre: calidad.nombre || "",
      descripcion: calidad.descripcion || "",
      micraje_min: calidad.micraje_min || "",
      micraje_max: calidad.micraje_max || "",
      activo: calidad.activo ?? true,
    });
    setModalCalidad(true);
  };

  const guardarCalidad = async (e) => {
    e.preventDefault();

    const datos = {
      ...formCalidad,
      micraje_min: formCalidad.micraje_min
        ? Number(formCalidad.micraje_min)
        : null,
      micraje_max: formCalidad.micraje_max
        ? Number(formCalidad.micraje_max)
        : null,
    };

    try {
      if (calidadEditando) {
        await api.patch(
          `/configuracion/calidades/${calidadEditando.id}/`,
          datos
        );
      } else {
        await api.post("/configuracion/calidades/", datos);
      }

      setModalCalidad(false);
      setCalidadEditando(null);
      await cargarDatos();
    } catch (error) {
      console.error(error);
      alert("No se pudo guardar la calidad de fibra.");
    }
  };

  const cambiarEstadoCalidad = async (calidad) => {
    try {
      await api.patch(`/configuracion/calidades/${calidad.id}/`, {
        activo: !calidad.activo,
      });

      await cargarDatos();
    } catch (error) {
      console.error(error);
      alert("No se pudo cambiar el estado de la calidad.");
    }
  };

  const abrirNuevoEstado = () => {
    setEstadoEditando(null);
    setFormEstado({
      nombre: "",
      color: "#07226B",
      activo: true,
    });
    setModalEstado(true);
  };

  const abrirEditarEstado = (estado) => {
    setEstadoEditando(estado);
    setFormEstado({
      nombre: estado.nombre || "",
      color: estado.color || "#07226B",
      activo: estado.activo ?? true,
    });
    setModalEstado(true);
  };

  const guardarEstado = async (e) => {
    e.preventDefault();

    try {
      if (estadoEditando) {
        await api.patch(
          `/configuracion/estados/${estadoEditando.id}/`,
          formEstado
        );
      } else {
        await api.post("/configuracion/estados/", formEstado);
      }

      setModalEstado(false);
      setEstadoEditando(null);
      await cargarDatos();
    } catch (error) {
      console.error(error);
      alert("No se pudo guardar el estado de procesamiento.");
    }
  };

  const cambiarEstadoProceso = async (estado) => {
    try {
      await api.patch(`/configuracion/estados/${estado.id}/`, {
        activo: !estado.activo,
      });

      await cargarDatos();
    } catch (error) {
      console.error(error);
      alert("No se pudo cambiar el estado de procesamiento.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-[28px] font-bold leading-tight text-azul sm:text-[32px]">
            Configuración
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-textoSuave sm:text-base">
            Administra los parámetros generales del sistema, calidades de fibra,
            estados de proceso y regiones operativas.
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
            onClick={guardarConfiguracion}
            disabled={guardando}
            className="flex items-center justify-center gap-2 rounded-xl bg-azul px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-azul2 disabled:opacity-60"
          >
            <Save size={18} />
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </section>

      {mensaje && (
        <section className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
          <CheckCircle size={22} />
          <p className="font-semibold">{mensaje}</p>
        </section>
      )}

      {error && (
        <section className="flex items-center gap-3 rounded-xl border border-red-200 bg-rojoClaro p-4 text-rojo">
          <AlertTriangle size={22} />
          <p className="font-semibold">{error}</p>
        </section>
      )}

      <form onSubmit={guardarConfiguracion} className="space-y-6">
        <section className="rounded-xl border border-borde bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <Building2 className="text-azul" size={24} />
            <div>
              <h3 className="text-xl font-bold text-azul">
                Datos de la empresa
              </h3>
              <p className="text-sm text-textoSuave">
                Información institucional usada en reportes y documentos.
              </p>
            </div>
          </div>

          {cargando ? (
            <p className="text-textoSuave">Cargando configuración...</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <CampoTexto
                label="Nombre de empresa"
                value={configuracion.nombre_empresa}
                onChange={(valor) => cambiarConfig("nombre_empresa", valor)}
              />

              <CampoTexto
                label="RUC"
                value={configuracion.ruc}
                onChange={(valor) => cambiarConfig("ruc", valor)}
              />

              <CampoTexto
                label="Teléfono"
                value={configuracion.telefono}
                onChange={(valor) => cambiarConfig("telefono", valor)}
              />

              <CampoTexto
                label="Correo de notificaciones"
                type="email"
                value={configuracion.correo_notificaciones}
                onChange={(valor) =>
                  cambiarConfig("correo_notificaciones", valor)
                }
              />

              <div className="md:col-span-2">
                <CampoTexto
                  label="Dirección"
                  value={configuracion.direccion}
                  onChange={(valor) => cambiarConfig("direccion", valor)}
                />
              </div>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-borde bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <Settings className="text-azul" size={24} />
            <div>
              <h3 className="text-xl font-bold text-azul">
                Parámetros generales
              </h3>
              <p className="text-sm text-textoSuave">
                Configura moneda, tipo de cambio y alertas de inventario.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <CampoTexto
              label="Moneda base"
              value={configuracion.moneda_base}
              onChange={(valor) => cambiarConfig("moneda_base", valor)}
            />

            <CampoTexto
              label="Símbolo de moneda"
              value={configuracion.simbolo_moneda}
              onChange={(valor) => cambiarConfig("simbolo_moneda", valor)}
            />

            <CampoTexto
              label="Tipo de cambio"
              type="number"
              step="0.01"
              value={configuracion.tipo_cambio}
              onChange={(valor) => cambiarConfig("tipo_cambio", valor)}
            />

            <CampoTexto
              label="Umbral stock bajo kg"
              type="number"
              step="0.01"
              value={configuracion.umbral_stock_bajo}
              onChange={(valor) => cambiarConfig("umbral_stock_bajo", valor)}
            />
          </div>

          <div className="mt-5 rounded-xl border border-borde bg-azulSuave p-4">
            <label className="flex cursor-pointer items-center justify-between gap-4">
              <div>
                <p className="font-bold text-texto">
                  Activar alerta de stock bajo
                </p>
                <p className="text-sm text-textoSuave">
                  El sistema mostrará alertas cuando un lote esté por debajo del
                  umbral configurado.
                </p>
              </div>

              <input
                type="checkbox"
                checked={configuracion.alerta_stock_activa}
                onChange={(e) =>
                  cambiarConfig("alerta_stock_activa", e.target.checked)
                }
                className="h-5 w-5 rounded border-borde text-azul focus:ring-azul"
              />
            </label>
          </div>
        </section>
      </form>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article className="rounded-xl border border-borde bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Layers className="text-azul" size={24} />
              <div>
                <h3 className="text-xl font-bold text-azul">
                  Calidades de fibra
                </h3>
                <p className="text-sm text-textoSuave">
                  Define grados, descripciones y micraje.
                </p>
              </div>
            </div>

            <button
              onClick={abrirNuevaCalidad}
              className="flex items-center gap-2 rounded-lg bg-azul px-4 py-2 text-sm font-bold text-white hover:bg-azul2"
            >
              <Plus size={17} />
              Nueva
            </button>
          </div>

          <div className="space-y-3">
            {calidades.length === 0 ? (
              <p className="rounded-lg bg-azulSuave p-4 text-sm text-textoSuave">
                No hay calidades registradas.
              </p>
            ) : (
              calidades.map((calidad) => (
                <div
                  key={calidad.id}
                  className="flex flex-col gap-3 rounded-xl border border-borde p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-bold text-texto">{calidad.nombre}</p>
                    <p className="text-sm text-textoSuave">
                      {calidad.descripcion || "Sin descripción"}
                    </p>
                    <p className="mt-1 text-xs text-gris">
                      Micraje: {calidad.micraje_min || "-"} -{" "}
                      {calidad.micraje_max || "-"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        calidad.activo
                          ? "bg-green-100 text-green-700"
                          : "bg-rojoClaro text-rojo"
                      }`}
                    >
                      {calidad.activo ? "Activo" : "Inactivo"}
                    </span>

                    <button
                      onClick={() => abrirEditarCalidad(calidad)}
                      className="rounded-lg p-2 text-amber-600 hover:bg-amber-50"
                    >
                      <Edit size={18} />
                    </button>

                    <button
                      onClick={() => cambiarEstadoCalidad(calidad)}
                      className="rounded-lg p-2 text-rojo hover:bg-rojoClaro/40"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-xl border border-borde bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <SlidersHorizontal className="text-azul" size={24} />
              <div>
                <h3 className="text-xl font-bold text-azul">
                  Estados de procesamiento
                </h3>
                <p className="text-sm text-textoSuave">
                  Controla los estados usados en operación.
                </p>
              </div>
            </div>

            <button
              onClick={abrirNuevoEstado}
              className="flex items-center gap-2 rounded-lg bg-azul px-4 py-2 text-sm font-bold text-white hover:bg-azul2"
            >
              <Plus size={17} />
              Nuevo
            </button>
          </div>

          <div className="space-y-3">
            {estados.length === 0 ? (
              <p className="rounded-lg bg-azulSuave p-4 text-sm text-textoSuave">
                No hay estados registrados.
              </p>
            ) : (
              estados.map((estado) => (
                <div
                  key={estado.id}
                  className="flex flex-col gap-3 rounded-xl border border-borde p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-5 w-5 rounded-full"
                      style={{ backgroundColor: estado.color || "#07226B" }}
                    />
                    <div>
                      <p className="font-bold text-texto">{estado.nombre}</p>
                      <p className="text-sm text-textoSuave">
                        Color: {estado.color || "#07226B"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        estado.activo
                          ? "bg-green-100 text-green-700"
                          : "bg-rojoClaro text-rojo"
                      }`}
                    >
                      {estado.activo ? "Activo" : "Inactivo"}
                    </span>

                    <button
                      onClick={() => abrirEditarEstado(estado)}
                      className="rounded-lg p-2 text-amber-600 hover:bg-amber-50"
                    >
                      <Edit size={18} />
                    </button>

                    <button
                      onClick={() => cambiarEstadoProceso(estado)}
                      className="rounded-lg p-2 text-rojo hover:bg-rojoClaro/40"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="rounded-xl border border-borde bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <Globe2 className="text-azul" size={24} />
          <div>
            <h3 className="text-xl font-bold text-azul">Regiones activas</h3>
            <p className="text-sm text-textoSuave">
              Regiones disponibles para proveedores, compras y reportes.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {regiones.length === 0 ? (
            <p className="text-sm text-textoSuave">
              No hay regiones activas registradas.
            </p>
          ) : (
            regiones.map((region) => (
              <div
                key={region.id}
                className="rounded-xl border border-borde bg-azulSuave p-4"
              >
                <p className="font-bold text-azul">{region.nombre}</p>
                <p className="text-sm text-textoSuave">
                  Código: {region.codigo || "-"}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      {modalCalidad && (
        <ModalBase
          titulo={calidadEditando ? "Editar calidad" : "Nueva calidad"}
          onClose={() => setModalCalidad(false)}
        >
          <form onSubmit={guardarCalidad} className="grid grid-cols-1 gap-4">
            <CampoTexto
              label="Nombre"
              value={formCalidad.nombre}
              onChange={(valor) =>
                setFormCalidad((actual) => ({ ...actual, nombre: valor }))
              }
            />

            <CampoTextarea
              label="Descripción"
              value={formCalidad.descripcion}
              onChange={(valor) =>
                setFormCalidad((actual) => ({
                  ...actual,
                  descripcion: valor,
                }))
              }
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <CampoTexto
                label="Micraje mínimo"
                type="number"
                step="0.01"
                value={formCalidad.micraje_min}
                onChange={(valor) =>
                  setFormCalidad((actual) => ({
                    ...actual,
                    micraje_min: valor,
                  }))
                }
              />

              <CampoTexto
                label="Micraje máximo"
                type="number"
                step="0.01"
                value={formCalidad.micraje_max}
                onChange={(valor) =>
                  setFormCalidad((actual) => ({
                    ...actual,
                    micraje_max: valor,
                  }))
                }
              />
            </div>

            <BotonesModal
              onCancel={() => setModalCalidad(false)}
              texto={calidadEditando ? "Guardar cambios" : "Crear calidad"}
            />
          </form>
        </ModalBase>
      )}

      {modalEstado && (
        <ModalBase
          titulo={estadoEditando ? "Editar estado" : "Nuevo estado"}
          onClose={() => setModalEstado(false)}
        >
          <form onSubmit={guardarEstado} className="grid grid-cols-1 gap-4">
            <CampoTexto
              label="Nombre"
              value={formEstado.nombre}
              onChange={(valor) =>
                setFormEstado((actual) => ({ ...actual, nombre: valor }))
              }
            />

            <CampoTexto
              label="Color"
              type="color"
              value={formEstado.color}
              onChange={(valor) =>
                setFormEstado((actual) => ({ ...actual, color: valor }))
              }
            />

            <BotonesModal
              onCancel={() => setModalEstado(false)}
              texto={estadoEditando ? "Guardar cambios" : "Crear estado"}
            />
          </form>
        </ModalBase>
      )}
    </div>
  );
}

function CampoTexto({
  label,
  value,
  onChange,
  type = "text",
  step = undefined,
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-bold text-texto">
        {label}
      </label>
      <input
        required={label === "Nombre" || label === "Nombre de empresa"}
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-borde bg-white px-4 py-3 outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
      />
    </div>
  );
}

function CampoTextarea({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-bold text-texto">
        {label}
      </label>
      <textarea
        rows="3"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-borde bg-white px-4 py-3 outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
      />
    </div>
  );
}

function ModalBase({ titulo, children, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-azul">{titulo}</h3>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-textoSuave hover:bg-azulSuave"
          >
            <X size={22} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function BotonesModal({ onCancel, texto }) {
  return (
    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-borde px-5 py-3 text-sm font-bold text-textoSuave hover:bg-azulSuave"
      >
        Cancelar
      </button>

      <button
        type="submit"
        className="flex items-center justify-center gap-2 rounded-lg bg-azul px-5 py-3 text-sm font-bold text-white hover:bg-azul2"
      >
        <Save size={18} />
        {texto}
      </button>
    </div>
  );
}

export default Configuracion;