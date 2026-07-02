import { useEffect, useMemo, useState } from "react";
import {
  Ban,
  CheckCircle,
  Edit,
  Lock,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Upload,
  UserPlus,
  Users as UsersIcon,
  X,
} from "lucide-react";

import api from "../services/api";

function obtenerLista(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  return [];
}

function normalizarFoto(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${window.location.origin}${url}`;
}

function nombreCompleto(usuario) {
  const nombre = `${usuario.first_name || ""} ${usuario.last_name || ""}`.trim();
  return usuario.nombre_completo || nombre || usuario.username || "Usuario";
}

function iniciales(usuario) {
  const nombre = nombreCompleto(usuario).trim().split(" ").filter(Boolean);

  if (nombre.length === 0) return "US";
  if (nombre.length === 1) return nombre[0].slice(0, 2).toUpperCase();

  return `${nombre[0][0]}${nombre[1][0]}`.toUpperCase();
}

function obtenerRol(usuario) {
  if (Array.isArray(usuario.groups_names) && usuario.groups_names.length > 0) {
    return usuario.groups_names[0];
  }

  if (usuario.rol) return usuario.rol;

  if (usuario.is_superuser || usuario.is_staff) return "Administrador";

  return "Sin rol";
}

function claseRol(rol) {
  const texto = String(rol || "").toLowerCase();

  if (texto.includes("administrador")) return "bg-azulClaro text-azul";
  if (texto.includes("operador")) return "bg-moradoClaro text-morado";
  if (texto.includes("visualizador")) return "bg-azulSuave text-azul2";

  return "bg-borde text-textoSuave";
}

function descripcionRol(rol) {
  const texto = String(rol || "").toLowerCase();

  if (texto.includes("administrador")) {
    return "Acceso total a finanzas, usuarios y reportes.";
  }

  if (texto.includes("operador")) {
    return "Gestión de compras, inventario y pagos.";
  }

  if (texto.includes("visualizador")) {
    return "Solo lectura para consultas y auditorías.";
  }

  return "Rol del sistema.";
}

function formatoFecha(valor) {
  if (!valor) return "Sin acceso";

  return new Date(valor).toLocaleString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Avatar({ foto, texto, grande = false }) {
  const [error, setError] = useState(false);
  const medida = grande ? "h-20 w-20" : "h-12 w-12";

  if (foto && !error) {
    return (
      <img
        src={foto}
        alt="Foto de perfil"
        onError={() => setError(true)}
        className={`${medida} flex-shrink-0 rounded-full border border-borde bg-white object-cover shadow-sm`}
      />
    );
  }

  return (
    <div
      className={`${medida} flex flex-shrink-0 items-center justify-center rounded-full bg-azul text-sm font-bold text-white shadow-sm`}
    >
      {texto}
    </div>
  );
}

function Campo({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-texto">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-borde bg-white px-4 py-3 text-texto outline-none focus:border-azul2"
      />
    </div>
  );
}

function Tarjeta({ titulo, valor, icono }) {
  return (
    <article className="rounded-xl border border-borde bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-textoSuave">{titulo}</p>
          <h3 className="mt-2 text-3xl font-bold text-azul">{valor}</h3>
        </div>

        <div className="rounded-xl bg-azulClaro p-3 text-azul">
          {icono}
        </div>
      </div>
    </article>
  );
}

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);

  const [buscar, setBuscar] = useState("");
  const [filtroRol, setFiltroRol] = useState("TODOS");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [editando, setEditando] = useState(null);

  const [formulario, setFormulario] = useState({
    nombre_completo: "",
    username: "",
    email: "",
    rol: "",
    password: "",
    is_active: true,
    foto_perfil: null,
    foto_preview: "",
  });

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError("");

      const [respUsuarios, respRoles] = await Promise.all([
        api.get("/usuarios/usuarios/"),
        api.get("/usuarios/roles/"),
      ]);

      setUsuarios(obtenerLista(respUsuarios.data));
      setRoles(obtenerLista(respRoles.data));
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la información de usuarios.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((usuario) => {
      const rol = obtenerRol(usuario);

      const texto = `${nombreCompleto(usuario)} ${usuario.username} ${usuario.email} ${rol}`.toLowerCase();

      const coincideBusqueda = texto.includes(buscar.toLowerCase());

      const coincideRol =
        filtroRol === "TODOS" ||
        rol.toLowerCase() === filtroRol.toLowerCase();

      const coincideEstado =
        filtroEstado === "TODOS" ||
        (filtroEstado === "ACTIVO" && usuario.is_active) ||
        (filtroEstado === "INACTIVO" && !usuario.is_active);

      return coincideBusqueda && coincideRol && coincideEstado;
    });
  }, [usuarios, buscar, filtroRol, filtroEstado]);

  const totalUsuarios = usuarios.length;
  const usuariosActivos = usuarios.filter((usuario) => usuario.is_active).length;
  const administradores = usuarios.filter((usuario) =>
    obtenerRol(usuario).toLowerCase().includes("administrador")
  ).length;
  const operadores = usuarios.filter((usuario) =>
    obtenerRol(usuario).toLowerCase().includes("operador")
  ).length;

  const rolIdUsuario = (usuario) => {
    if (Array.isArray(usuario.groups) && usuario.groups.length > 0) {
      const primero = usuario.groups[0];

      if (typeof primero === "number") return String(primero);
      if (typeof primero === "object") return String(primero.id);
    }

    const rol = obtenerRol(usuario);
    return String(roles.find((item) => item.name === rol)?.id || "");
  };

  const formularioVacio = () => ({
    nombre_completo: "",
    username: "",
    email: "",
    rol: roles[0]?.id ? String(roles[0].id) : "",
    password: "",
    is_active: true,
    foto_perfil: null,
    foto_preview: "",
  });

  const abrirNuevo = () => {
    setEditando(null);
    setFormulario(formularioVacio());
    setMensaje("");
    setError("");
    setDrawerAbierto(true);
  };

  const abrirEditar = (usuario) => {
    setEditando(usuario);

    setFormulario({
      nombre_completo: nombreCompleto(usuario),
      username: usuario.username || "",
      email: usuario.email || "",
      rol: rolIdUsuario(usuario),
      password: "",
      is_active: Boolean(usuario.is_active),
      foto_perfil: null,
      foto_preview: normalizarFoto(usuario.foto_perfil_url),
    });

    setMensaje("");
    setError("");
    setDrawerAbierto(true);
  };

  const cerrarDrawer = () => {
    setDrawerAbierto(false);
    setEditando(null);
  };

  const cambiarFormulario = (campo, valor) => {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  };

  const generarPassword = () => {
    const caracteres =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@$#";
    const arreglo = new Uint32Array(12);

    window.crypto.getRandomValues(arreglo);

    const password = Array.from(arreglo)
      .map((numero) => caracteres[numero % caracteres.length])
      .join("");

    cambiarFormulario("password", password);
  };

  const cambiarFoto = (archivo) => {
    if (!archivo) return;

    cambiarFormulario("foto_perfil", archivo);
    cambiarFormulario("foto_preview", URL.createObjectURL(archivo));
  };

  const guardarUsuario = async (evento) => {
    evento.preventDefault();

    if (!formulario.nombre_completo.trim()) {
      alert("Ingresa el nombre completo.");
      return;
    }

    if (!formulario.username.trim()) {
      alert("Ingresa el nombre de usuario.");
      return;
    }

    if (!formulario.email.trim()) {
      alert("Ingresa el correo electrónico.");
      return;
    }

    if (!editando && !formulario.password.trim()) {
      alert("La contraseña es obligatoria para crear un usuario.");
      return;
    }

    if (!formulario.rol) {
      alert("Selecciona un rol del sistema.");
      return;
    }

    const partes = formulario.nombre_completo.trim().split(" ");
    const firstName = partes[0] || "";
    const lastName = partes.slice(1).join(" ");

    const datos = new FormData();

    datos.append("nombre_completo", formulario.nombre_completo.trim());
    datos.append("first_name", firstName);
    datos.append("last_name", lastName);
    datos.append("username", formulario.username.trim());
    datos.append("email", formulario.email.trim());
    datos.append("is_active", formulario.is_active ? "true" : "false");
    datos.append("groups", formulario.rol);

    if (formulario.password.trim()) {
      datos.append("password", formulario.password.trim());
    }

    if (formulario.foto_perfil) {
      datos.append("foto_perfil", formulario.foto_perfil);
    }

    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      if (editando) {
        await api.patch(`/usuarios/usuarios/${editando.id}/`, datos, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        setMensaje("Usuario actualizado correctamente.");
      } else {
        await api.post("/usuarios/usuarios/", datos, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        setMensaje("Usuario creado correctamente.");
      }

      cerrarDrawer();
      await cargarDatos();
    } catch (err) {
      console.error(err);

      const data = err.response?.data;
      let texto = "No se pudo guardar el usuario.";

      if (typeof data === "string") {
        texto = data;
      } else if (data && typeof data === "object") {
        texto = Object.entries(data)
          .map(([campo, valor]) => {
            if (Array.isArray(valor)) return `${campo}: ${valor.join(", ")}`;
            return `${campo}: ${valor}`;
          })
          .join("\n");
      }

      alert(texto);
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstadoUsuario = async (usuario) => {
    try {
      const datos = new FormData();

      datos.append("username", usuario.username);
      datos.append("email", usuario.email || "");
      datos.append("first_name", usuario.first_name || "");
      datos.append("last_name", usuario.last_name || "");
      datos.append("is_active", usuario.is_active ? "false" : "true");

      if (Array.isArray(usuario.groups) && usuario.groups.length > 0) {
        datos.append("groups", usuario.groups[0]);
      }

      await api.patch(`/usuarios/usuarios/${usuario.id}/`, datos, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await cargarDatos();
    } catch (err) {
      console.error(err);
      alert("No se pudo cambiar el estado del usuario.");
    }
  };

  const eliminarUsuario = async (usuario) => {
    const confirmar = window.confirm(`¿Eliminar el usuario ${usuario.username}?`);

    if (!confirmar) return;

    try {
      await api.delete(`/usuarios/usuarios/${usuario.id}/`);
      await cargarDatos();
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar el usuario. Puedes desactivarlo en su lugar.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-[28px] font-bold leading-tight text-azul sm:text-[32px]">
            Gestión de Usuarios
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-textoSuave sm:text-base">
            Administra los accesos, roles, contraseñas y fotos de perfil del personal.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={cargarDatos}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-azulClaro px-5 py-3 text-sm font-bold text-azul"
          >
            <RefreshCw size={18} />
            Actualizar
          </button>

          <button
            onClick={abrirNuevo}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-azul px-5 py-3 text-sm font-bold text-white"
          >
            <UserPlus size={18} />
            Nuevo usuario
          </button>
        </div>
      </section>

      {mensaje && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-semibold text-green-700">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Tarjeta titulo="Total usuarios" valor={totalUsuarios} icono={<UsersIcon size={22} />} />
        <Tarjeta titulo="Activos" valor={usuariosActivos} icono={<CheckCircle size={22} />} />
        <Tarjeta titulo="Administradores" valor={administradores} icono={<Lock size={22} />} />
        <Tarjeta titulo="Operadores" valor={operadores} icono={<UsersIcon size={22} />} />
      </section>

      <section className="rounded-xl border border-borde bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-borde px-5 py-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gris" size={18} />
            <input
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              placeholder="Buscar usuarios..."
              className="w-full rounded-xl border border-borde bg-azulSuave py-2.5 pl-10 pr-4 text-sm outline-none focus:border-azul2"
            />
          </div>

          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            className="rounded-xl border border-borde bg-azulSuave px-4 py-2.5 text-sm outline-none"
          >
            <option value="TODOS">Todos los roles</option>
            {roles.map((rol) => (
              <option key={rol.id} value={rol.name}>
                {rol.name}
              </option>
            ))}
          </select>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="rounded-xl border border-borde bg-azulSuave px-4 py-2.5 text-sm outline-none"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="ACTIVO">Activos</option>
            <option value="INACTIVO">Inactivos</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-azulSuave text-xs uppercase text-gris">
              <tr>
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Último acceso</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-borde">
              {cargando ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-textoSuave">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-textoSuave">
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((usuario) => {
                  const rol = obtenerRol(usuario);
                  const foto = normalizarFoto(usuario.foto_perfil_url);

                  return (
                    <tr key={usuario.id} className="transition hover:bg-azulSuave/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar foto={foto} texto={iniciales(usuario)} />
                          <div>
                            <p className="font-bold text-texto">{usuario.username}</p>
                            <p className="text-xs text-textoSuave">{usuario.email || "Sin correo"}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-semibold text-texto">
                        {nombreCompleto(usuario)}
                      </td>

                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${claseRol(rol)}`}>
                          {rol}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            usuario.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-rojoClaro text-rojo"
                          }`}
                        >
                          {usuario.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-textoSuave">
                        {formatoFecha(usuario.last_login)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => abrirEditar(usuario)}
                            className="rounded-lg p-2 text-amber-600 hover:bg-amber-50"
                            title="Editar"
                          >
                            <Edit size={18} />
                          </button>

                          <button
                            onClick={() => cambiarEstadoUsuario(usuario)}
                            className={`rounded-lg p-2 ${
                              usuario.is_active
                                ? "text-rojo hover:bg-rojoClaro/40"
                                : "text-green-700 hover:bg-green-50"
                            }`}
                            title={usuario.is_active ? "Desactivar" : "Activar"}
                          >
                            {usuario.is_active ? <Ban size={18} /> : <CheckCircle size={18} />}
                          </button>

                          <button
                            onClick={() => eliminarUsuario(usuario)}
                            className="rounded-lg p-2 text-rojo hover:bg-rojoClaro/40"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {drawerAbierto && (
        <>
          <div className="fixed inset-0 z-[90] bg-black/40" onClick={cerrarDrawer} />

          <aside className="fixed right-0 top-0 z-[100] h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-azul">
                  {editando ? "Editar usuario" : "Crear usuario"}
                </h3>
                <p className="mt-1 text-sm text-textoSuave">
                  Completa los datos de acceso.
                </p>
              </div>

              <button
                onClick={cerrarDrawer}
                className="rounded-lg p-2 text-textoSuave hover:bg-azulSuave"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={guardarUsuario} className="space-y-5">
              <div className="rounded-xl border border-borde bg-azulSuave p-4">
                <div className="flex items-center gap-4">
                  <Avatar
                    foto={formulario.foto_preview}
                    texto={editando ? iniciales(editando) : "US"}
                    grande
                  />

                  <div className="flex-1">
                    <p className="font-bold text-texto">
                      {formulario.nombre_completo || "Foto de perfil"}
                    </p>
                    <p className="text-sm text-textoSuave">
                      {formulario.email || "Selecciona una imagen para el usuario."}
                    </p>
                  </div>
                </div>

                <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-borde bg-white px-4 py-3 text-sm font-bold text-azul hover:bg-azulClaro">
                  <Upload size={18} />
                  Cambiar foto de perfil
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => cambiarFoto(e.target.files?.[0])}
                    className="hidden"
                  />
                </label>

                <p className="mt-2 text-xs text-textoSuave">
                  Formatos permitidos: JPG, PNG, WebP o ICO.
                </p>
              </div>

              <Campo
                label="Nombre completo"
                value={formulario.nombre_completo}
                onChange={(valor) => cambiarFormulario("nombre_completo", valor)}
                placeholder="Ej. Janely Apaza"
              />

              <Campo
                label="Nombre de usuario"
                value={formulario.username}
                onChange={(valor) => cambiarFormulario("username", valor)}
                placeholder="Ej. janely"
              />

              <Campo
                label="Correo electrónico"
                type="email"
                value={formulario.email}
                onChange={(valor) => cambiarFormulario("email", valor)}
                placeholder="janely@nexis.pe"
              />

              <div>
                <label className="mb-2 block text-sm font-bold text-texto">
                  Rol del sistema
                </label>

                <div className="space-y-2">
                  {roles.map((rol) => (
                    <label
                      key={rol.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                        String(formulario.rol) === String(rol.id)
                          ? "border-azul bg-azulSuave"
                          : "border-borde bg-white hover:bg-azulSuave/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="rol"
                        value={rol.id}
                        checked={String(formulario.rol) === String(rol.id)}
                        onChange={(e) => cambiarFormulario("rol", e.target.value)}
                        className="mt-1 text-azul focus:ring-azul"
                      />

                      <span>
                        <span className="block font-bold text-texto">{rol.name}</span>
                        <span className="block text-xs text-textoSuave">
                          {descripcionRol(rol.name)}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-texto">
                  Contraseña
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formulario.password}
                    onChange={(e) => cambiarFormulario("password", e.target.value)}
                    placeholder={editando ? "Dejar vacío si no cambia" : "Escribe una contraseña"}
                    className="flex-1 rounded-xl border border-borde bg-white px-4 py-3 outline-none focus:border-azul2"
                  />

                  <button
                    type="button"
                    onClick={generarPassword}
                    className="rounded-xl bg-azulClaro px-4 py-3 text-sm font-bold text-azul"
                  >
                    Generar
                  </button>
                </div>

                <p className="mt-1 text-xs text-textoSuave">
                  Si editas un usuario y dejas este campo vacío, la contraseña no cambia.
                </p>
              </div>

              <label className="flex items-center justify-between rounded-xl border border-borde bg-azulSuave p-4">
                <span>
                  <span className="block font-bold text-texto">Usuario activo</span>
                  <span className="block text-xs text-textoSuave">
                    Si está inactivo, no podrá iniciar sesión.
                  </span>
                </span>

                <input
                  type="checkbox"
                  checked={formulario.is_active}
                  onChange={(e) => cambiarFormulario("is_active", e.target.checked)}
                  className="h-5 w-5 rounded border-borde text-azul focus:ring-azul"
                />
              </label>

              <div className="flex gap-3 border-t border-borde pt-5">
                <button
                  type="button"
                  onClick={cerrarDrawer}
                  className="flex-1 rounded-xl border border-borde bg-white px-5 py-3 font-bold text-texto"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-azul px-5 py-3 font-bold text-white disabled:opacity-60"
                >
                  <Save size={18} />
                  {guardando ? "Guardando..." : editando ? "Guardar" : "Crear usuario"}
                </button>
              </div>
            </form>
          </aside>
        </>
      )}
    </div>
  );
}

export default Usuarios;
