import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle,
  Download,
  Edit,
  Filter,
  Lock,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users as UsersIcon,
  X,
} from "lucide-react";
import api from "../services/api";

const AVATARES_FEMENINOS = [
  "https://i.pravatar.cc/150?img=47",
  "https://i.pravatar.cc/150?img=44",
  "https://i.pravatar.cc/150?img=45",
  "https://i.pravatar.cc/150?img=48",
  "https://i.pravatar.cc/150?img=49",
  "https://i.pravatar.cc/150?img=32",
  "https://i.pravatar.cc/150?img=20",
  "https://i.pravatar.cc/150?img=25",
];

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);

  const [buscar, setBuscar] = useState("");
  const [filtroRol, setFiltroRol] = useState("TODOS");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [paginaActual, setPaginaActual] = useState(1);
  const usuariosPorPagina = 10;

  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [editando, setEditando] = useState(null);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [formulario, setFormulario] = useState({
    nombre_completo: "",
    username: "",
    email: "",
    rol: "",
    password: "Nexis12345",
    is_active: true,
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

      const [respUsuarios, respRoles] = await Promise.all([
        api.get("/usuarios/usuarios/"),
        api.get("/usuarios/roles/"),
      ]);

      setUsuarios(obtenerLista(respUsuarios.data));
      setRoles(obtenerLista(respRoles.data));
    } catch (error) {
      console.error(error);
      setError("No se pudo cargar la información de usuarios.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const nombreCompletoUsuario = (usuario) => {
    const nombre = `${usuario.first_name || ""} ${usuario.last_name || ""}`.trim();

    if (nombre) return nombre;
    return usuario.username || "Usuario";
  };

  const iniciales = (usuario) => {
    const nombre = nombreCompletoUsuario(usuario);
    const partes = nombre.trim().split(" ");

    if (partes.length === 1) {
      return partes[0].slice(0, 2).toUpperCase();
    }

    return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
  };

  const obtenerAvatar = (usuario, index) => {
    const nombre = String(usuario.username || "").toLowerCase();
    const correo = String(usuario.email || "").toLowerCase();

    if (
      usuario.is_superuser ||
      usuario.is_staff ||
      nombre.includes("admin") ||
      correo.includes("admin")
    ) {
      return "https://i.pravatar.cc/150?img=47";
    }

    return AVATARES_FEMENINOS[index % AVATARES_FEMENINOS.length];
  };

  const obtenerRolesUsuario = (usuario) => {
    if (Array.isArray(usuario.groups_names)) {
      return usuario.groups_names;
    }

    if (Array.isArray(usuario.roles)) {
      return usuario.roles.map((rol) =>
        typeof rol === "string" ? rol : rol.name || rol.nombre
      );
    }

    if (Array.isArray(usuario.groups)) {
      return usuario.groups.map((grupo) => {
        if (typeof grupo === "string") return grupo;

        if (typeof grupo === "number") {
          return roles.find((rol) => rol.id === grupo)?.name || "Sin rol";
        }

        return grupo.name || grupo.nombre || "Sin rol";
      });
    }

    if (usuario.rol) {
      return [usuario.rol];
    }

    if (usuario.is_superuser || usuario.is_staff) {
      return ["Administrador"];
    }

    return ["Sin rol"];
  };

  const obtenerRolPrincipal = (usuario) => {
    const lista = obtenerRolesUsuario(usuario);
    return lista[0] || "Sin rol";
  };

  const obtenerRolIdUsuario = (usuario) => {
    if (Array.isArray(usuario.groups) && usuario.groups.length > 0) {
      const primero = usuario.groups[0];

      if (typeof primero === "number") return primero;
      if (typeof primero === "object") return primero.id;

      if (typeof primero === "string") {
        return (
          roles.find((rol) => rol.name === primero || rol.nombre === primero)
            ?.id || ""
        );
      }
    }

    const principal = obtenerRolPrincipal(usuario);

    return (
      roles.find((rol) => rol.name === principal || rol.nombre === principal)
        ?.id || ""
    );
  };

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((usuario) => {
      const nombre = nombreCompletoUsuario(usuario);
      const rolesTexto = obtenerRolesUsuario(usuario).join(" ");

      const texto = `
        ${nombre}
        ${usuario.username || ""}
        ${usuario.email || ""}
        ${rolesTexto}
      `.toLowerCase();

      const coincideBusqueda = texto.includes(buscar.toLowerCase());

      const coincideRol =
        filtroRol === "TODOS"
          ? true
          : obtenerRolesUsuario(usuario).some(
              (rol) =>
                String(rol).toLowerCase() === String(filtroRol).toLowerCase()
            );

      const coincideEstado =
        filtroEstado === "TODOS"
          ? true
          : filtroEstado === "ACTIVO"
            ? usuario.is_active === true
            : usuario.is_active === false;

      return coincideBusqueda && coincideRol && coincideEstado;
    });
  }, [usuarios, buscar, filtroRol, filtroEstado, roles]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(usuariosFiltrados.length / usuariosPorPagina)
  );

  useEffect(() => {
    setPaginaActual(1);
  }, [buscar, filtroRol, filtroEstado]);

  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(totalPaginas);
    }
  }, [paginaActual, totalPaginas]);

  const indiceInicial = (paginaActual - 1) * usuariosPorPagina;
  const indiceFinal = Math.min(
    indiceInicial + usuariosPorPagina,
    usuariosFiltrados.length
  );

  const usuariosPaginados = usuariosFiltrados.slice(
    indiceInicial,
    indiceFinal
  );

  const totalUsuarios = usuarios.length;
  const usuariosActivos = usuarios.filter((usuario) => usuario.is_active).length;

  const operadores = usuarios.filter((usuario) =>
    obtenerRolesUsuario(usuario).some((rol) =>
      String(rol).toLowerCase().includes("operador")
    )
  ).length;

  const administradores = usuarios.filter(
    (usuario) =>
      usuario.is_staff ||
      usuario.is_superuser ||
      obtenerRolesUsuario(usuario).some((rol) =>
        String(rol).toLowerCase().includes("administrador")
      )
  ).length;

  const abrirNuevo = () => {
    setEditando(null);
    setFormulario({
      nombre_completo: "",
      username: "",
      email: "",
      rol: roles[0]?.id || "",
      password: "Nexis12345",
      is_active: true,
    });
    setDrawerAbierto(true);
  };

  const abrirEditar = (usuario) => {
    setEditando(usuario);
    setFormulario({
      nombre_completo: nombreCompletoUsuario(usuario),
      username: usuario.username || "",
      email: usuario.email || "",
      rol: obtenerRolIdUsuario(usuario),
      password: "",
      is_active: usuario.is_active,
    });
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
    const numero = Math.floor(1000 + Math.random() * 9000);
    cambiarFormulario("password", `Nexis${numero}`);
  };

  const guardarUsuario = async (e) => {
    e.preventDefault();

    const partesNombre = formulario.nombre_completo.trim().split(" ");
    const first_name = partesNombre[0] || "";
    const last_name = partesNombre.slice(1).join(" ");

    const datos = {
      username: formulario.username,
      email: formulario.email,
      first_name,
      last_name,
      is_active: formulario.is_active,
      groups: formulario.rol ? [Number(formulario.rol)] : [],
    };

    if (formulario.password) {
      datos.password = formulario.password;
    }

    try {
      setError("");
      setMensaje("");

      if (editando) {
        await api.patch(`/usuarios/usuarios/${editando.id}/`, datos);
        setMensaje("Usuario actualizado correctamente.");
      } else {
        await api.post("/usuarios/usuarios/", datos);
        setMensaje("Usuario creado correctamente.");
      }

      cerrarDrawer();
      await cargarDatos();
    } catch (error) {
      console.error(error);
      alert(
        "No se pudo guardar el usuario. Revisa que el usuario no esté repetido y que la contraseña esté completa."
      );
    }
  };

  const cambiarEstadoUsuario = async (usuario) => {
    try {
      await api.patch(`/usuarios/usuarios/${usuario.id}/`, {
        is_active: !usuario.is_active,
      });

      await cargarDatos();
    } catch (error) {
      console.error(error);
      alert("No se pudo cambiar el estado del usuario.");
    }
  };

  const eliminarUsuario = async (usuario) => {
    const confirmar = window.confirm(
      `¿Eliminar el usuario ${usuario.username}? Esta acción no se recomienda si tiene historial.`
    );

    if (!confirmar) return;

    try {
      await api.delete(`/usuarios/usuarios/${usuario.id}/`);
      await cargarDatos();
    } catch (error) {
      console.error(error);
      alert("No se pudo eliminar el usuario. Puedes desactivarlo en su lugar.");
    }
  };

  const limpiarFiltros = () => {
    setBuscar("");
    setFiltroRol("TODOS");
    setFiltroEstado("TODOS");
  };

  const exportarUsuarios = () => {
    const encabezados = [
      "Nombre",
      "Usuario",
      "Correo",
      "Rol",
      "Estado",
      "Último acceso",
    ];

    const filas = usuariosFiltrados.map((usuario) => [
      nombreCompletoUsuario(usuario),
      usuario.username,
      usuario.email,
      obtenerRolPrincipal(usuario),
      usuario.is_active ? "Activo" : "Inactivo",
      usuario.last_login || "Sin acceso",
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
    enlace.download = "usuarios_nexis.csv";
    enlace.click();
    URL.revokeObjectURL(url);
  };

  const formatoUltimoAcceso = (valor) => {
    if (!valor) return "Sin acceso";

    return new Date(valor).toLocaleString("es-PE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const claseRol = (rol) => {
    const rolLimpio = String(rol || "").toLowerCase();

    if (rolLimpio.includes("administrador")) {
      return "bg-azulClaro text-azul";
    }

    if (rolLimpio.includes("operador")) {
      return "bg-moradoClaro text-morado";
    }

    if (rolLimpio.includes("visualizador")) {
      return "bg-azulSuave text-azul2";
    }

    return "bg-borde text-textoSuave";
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-[28px] font-bold leading-tight text-azul sm:text-[32px]">
            Gestión de Usuarios
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-textoSuave sm:text-base">
            Administra los accesos, roles y permisos del personal en el sistema.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={exportarUsuarios}
            className="flex items-center justify-center gap-2 rounded-xl bg-azulClaro px-5 py-3 text-sm font-bold text-azul transition hover:bg-borde"
          >
            <Download size={18} />
            Exportar
          </button>

          <button
            onClick={abrirNuevo}
            className="flex items-center justify-center gap-2 rounded-xl bg-azul px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-azul2"
          >
            <UserPlus size={18} />
            Nuevo usuario
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

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <TarjetaUsuario
          titulo="Total usuarios"
          valor={totalUsuarios}
          detalle="+2 esta semana"
          icono={<UsersIcon size={24} />}
          clase="bg-azulClaro text-azul"
        />

        <TarjetaUsuario
          titulo="Usuarios activos"
          valor={usuariosActivos}
          detalle={`${
            totalUsuarios
              ? Math.round((usuariosActivos / totalUsuarios) * 100)
              : 0
          }% activos`}
          icono={<UserCheck size={24} />}
          clase="bg-green-100 text-green-700"
        />

        <TarjetaUsuario
          titulo="Operadores"
          valor={operadores}
          detalle="Personal operativo"
          icono={<Lock size={24} />}
          clase="bg-moradoClaro text-morado"
        />

        <TarjetaUsuario
          titulo="Administradores"
          valor={administradores}
          detalle="Control total"
          icono={<ShieldCheck size={24} />}
          clase="bg-rojoClaro text-rojo"
        />
      </section>

      <section className="rounded-xl border border-borde bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-3 text-gris" size={18} />
            <input
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              placeholder="Buscar usuarios o roles..."
              className="w-full rounded-xl border border-transparent bg-azulSuave py-2.5 pl-10 pr-4 text-sm outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
            />
          </div>

          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            className="rounded-xl border border-borde bg-azulSuave px-4 py-2.5 text-sm outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
          >
            <option value="TODOS">Todos los roles</option>
            {roles.map((rol) => (
              <option key={rol.id} value={rol.name || rol.nombre}>
                {rol.name || rol.nombre}
              </option>
            ))}
          </select>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="rounded-xl border border-borde bg-azulSuave px-4 py-2.5 text-sm outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="ACTIVO">Activos</option>
            <option value="INACTIVO">Inactivos</option>
          </select>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-textoSuave">
            Mostrando{" "}
            <span className="font-bold text-azul">
              {usuariosFiltrados.length}
            </span>{" "}
            de {usuarios.length} usuarios
          </p>

          <button
            onClick={limpiarFiltros}
            className="flex items-center justify-center gap-2 rounded-lg border border-borde px-4 py-2 text-sm font-bold text-azul hover:bg-azulSuave"
          >
            <Filter size={17} />
            Limpiar filtros
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-borde bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-borde bg-white px-6 py-4">
          <h3 className="text-xl font-bold text-texto">Listado Maestro</h3>

          <div className="flex gap-2">
            <button
              onClick={limpiarFiltros}
              className="rounded-lg p-2 text-textoSuave hover:bg-azulSuave"
            >
              <Filter size={20} />
            </button>

            <button
              onClick={cargarDatos}
              className="rounded-lg p-2 text-textoSuave hover:bg-azulSuave"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>

        <div className="custom-scrollbar overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-azulSuave text-textoSuave">
                <th className="px-6 py-4 font-bold">Nombre</th>
                <th className="px-6 py-4 font-bold">Usuario</th>
                <th className="px-6 py-4 font-bold">Rol</th>
                <th className="px-6 py-4 font-bold">Estado</th>
                <th className="px-6 py-4 font-bold">Último acceso</th>
                <th className="px-6 py-4 text-right font-bold">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-borde">
              {cargando ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-10 text-center text-textoSuave"
                  >
                    Cargando usuarios...
                  </td>
                </tr>
              ) : usuariosFiltrados.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-10 text-center text-textoSuave"
                  >
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                usuariosPaginados.map((usuario, index) => {
                  const rolPrincipal = obtenerRolPrincipal(usuario);
                  const avatar = obtenerAvatar(usuario, index);

                  return (
                    <tr
                      key={usuario.id}
                      className={`transition hover:bg-azulSuave/50 ${
                        !usuario.is_active ? "opacity-60" : ""
                      }`}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <AvatarUsuario
                            src={avatar}
                            texto={iniciales(usuario)}
                          />

                          <div>
                            <p className="font-bold text-texto">
                              {nombreCompletoUsuario(usuario)}
                            </p>
                            <p className="text-xs text-textoSuave">
                              {usuario.email || "Sin correo"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-textoSuave">
                        {usuario.username}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${claseRol(
                            rolPrincipal
                          )}`}
                        >
                          {rolPrincipal}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <div
                          className={`flex items-center gap-2 font-bold ${
                            usuario.is_active ? "text-green-700" : "text-gris"
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              usuario.is_active ? "bg-green-500" : "bg-gris"
                            }`}
                          />
                          {usuario.is_active ? "Activo" : "Inactivo"}
                        </div>
                      </td>

                      <td className="px-6 py-5 italic text-textoSuave">
                        {formatoUltimoAcceso(usuario.last_login)}
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => abrirEditar(usuario)}
                            className="rounded-lg p-2 text-amber-600 hover:bg-amber-50"
                            title="Editar"
                          >
                            <Edit size={20} />
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
                            {usuario.is_active ? (
                              <Ban size={20} />
                            ) : (
                              <CheckCircle size={20} />
                            )}
                          </button>

                          <button
                            onClick={() => eliminarUsuario(usuario)}
                            className="rounded-lg p-2 text-rojo hover:bg-rojoClaro/40"
                            title="Eliminar"
                          >
                            <Trash2 size={20} />
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

        <div className="flex flex-col gap-3 border-t border-borde bg-azulSuave px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-textoSuave">
            {usuariosFiltrados.length === 0
              ? "Mostrando 0 de 0 usuarios"
              : `Mostrando ${indiceInicial + 1}-${indiceFinal} de ${usuariosFiltrados.length} usuarios`}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={paginaActual === 1}
              onClick={() => setPaginaActual((pagina) => Math.max(pagina - 1, 1))}
              className="rounded-lg border border-borde bg-white px-4 py-1 text-sm text-textoSuave disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>

            <span className="rounded-lg bg-white px-3 py-1 text-sm font-semibold text-textoSuave">
              Página {paginaActual} de {totalPaginas}
            </span>

            <button
              type="button"
              disabled={paginaActual === totalPaginas}
              onClick={() =>
                setPaginaActual((pagina) => Math.min(pagina + 1, totalPaginas))
              }
              className="rounded-lg bg-azul px-4 py-1 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      </section>

      {drawerAbierto && (
        <>
          <div
            onClick={cerrarDrawer}
            className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
          />

          <aside className="fixed right-0 top-0 z-[100] h-screen w-full max-w-[430px] overflow-y-auto bg-white shadow-2xl">
            <div className="flex min-h-full flex-col p-7">
              <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-azul">
                    {editando ? "Editar usuario" : "Nuevo usuario"}
                  </h3>
                  <p className="mt-1 text-sm text-textoSuave">
                    Complete los datos de acceso.
                  </p>
                </div>

                <button
                  onClick={cerrarDrawer}
                  className="rounded-full p-2 text-textoSuave hover:bg-azulSuave"
                >
                  <X size={22} />
                </button>
              </div>

              {editando && (
                <div className="mb-6 flex items-center gap-4 rounded-xl border border-borde bg-azulSuave p-4">
                  <AvatarUsuario
                    src={obtenerAvatar(editando, 0)}
                    texto={iniciales(editando)}
                    grande
                  />

                  <div>
                    <p className="font-bold text-texto">
                      {nombreCompletoUsuario(editando)}
                    </p>
                    <p className="text-sm text-textoSuave">
                      {editando.email || "Sin correo"}
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={guardarUsuario} className="flex-1 space-y-5">
                <CampoTexto
                  label="Nombre completo"
                  value={formulario.nombre_completo}
                  onChange={(valor) =>
                    cambiarFormulario("nombre_completo", valor)
                  }
                  placeholder="Ej. Janely Apaza"
                />

                <CampoTexto
                  label="Nombre de usuario"
                  value={formulario.username}
                  onChange={(valor) => cambiarFormulario("username", valor)}
                  placeholder="Ej. janely"
                />

                <CampoTexto
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

                  <div className="grid grid-cols-1 gap-2">
                    {roles.length === 0 ? (
                      <p className="rounded-xl border border-borde bg-azulSuave p-4 text-sm text-textoSuave">
                        No hay roles registrados.
                      </p>
                    ) : (
                      roles.map((rol) => {
                        const idRol = String(rol.id);
                        const nombreRol = rol.name || rol.nombre;

                        return (
                          <label
                            key={rol.id}
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                              String(formulario.rol) === idRol
                                ? "border-azul bg-azulSuave"
                                : "border-borde hover:bg-azulSuave"
                            }`}
                          >
                            <input
                              type="radio"
                              name="rol"
                              value={idRol}
                              checked={String(formulario.rol) === idRol}
                              onChange={(e) =>
                                cambiarFormulario("rol", e.target.value)
                              }
                              className="text-azul focus:ring-azul"
                            />

                            <div>
                              <p className="font-bold text-texto">{nombreRol}</p>
                              <p className="text-xs text-textoSuave">
                                {descripcionRol(nombreRol)}
                              </p>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-texto">
                    Contraseña temporal
                  </label>

                  <div className="relative">
                    <input
                      type="text"
                      value={formulario.password}
                      onChange={(e) =>
                        cambiarFormulario("password", e.target.value)
                      }
                      placeholder={editando ? "Dejar vacío si no cambia" : ""}
                      required={!editando}
                      className="w-full rounded-xl border border-borde bg-azulSuave px-4 py-3 pr-24 outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
                    />

                    <button
                      type="button"
                      onClick={generarPassword}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-azul"
                    >
                      Generar
                    </button>
                  </div>

                  <p className="mt-2 text-xs italic text-textoSuave">
                    El usuario podrá cambiarla posteriormente.
                  </p>
                </div>

                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-borde bg-azulSuave p-4">
                  <div>
                    <p className="font-bold text-texto">Usuario activo</p>
                    <p className="text-xs text-textoSuave">
                      Si está inactivo, no podrá usar el sistema.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={formulario.is_active}
                    onChange={(e) =>
                      cambiarFormulario("is_active", e.target.checked)
                    }
                    className="h-5 w-5 rounded border-borde text-azul focus:ring-azul"
                  />
                </label>

                <div className="mt-8 flex gap-3 border-t border-borde pt-6">
                  <button
                    type="button"
                    onClick={cerrarDrawer}
                    className="flex-1 rounded-xl border border-borde py-3 text-sm font-bold text-textoSuave hover:bg-azulSuave"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-azul py-3 text-sm font-bold text-white hover:bg-azul2"
                  >
                    <Save size={18} />
                    {editando ? "Guardar" : "Crear usuario"}
                  </button>
                </div>
              </form>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

function AvatarUsuario({ src, texto, grande = false }) {
  const [errorImagen, setErrorImagen] = useState(false);

  const medida = grande ? "h-16 w-16" : "h-11 w-11";
  const textoTamano = grande ? "text-lg" : "text-sm";

  if (errorImagen) {
    return (
      <div
        className={`flex ${medida} flex-shrink-0 items-center justify-center rounded-full bg-azulClaro font-bold text-azul ${textoTamano}`}
      >
        {texto}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="Foto de perfil"
      onError={() => setErrorImagen(true)}
      className={`${medida} flex-shrink-0 rounded-full border-2 border-white object-cover shadow-sm`}
    />
  );
}

function TarjetaUsuario({ titulo, valor, detalle, icono, clase }) {
  return (
    <article className="rounded-xl border border-borde bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="mb-1 text-sm font-semibold text-textoSuave">{titulo}</p>
          <h3 className="text-3xl font-extrabold text-azul">{valor}</h3>
          <p className="mt-2 text-xs font-semibold text-textoSuave">{detalle}</p>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${clase}`}
        >
          {icono}
        </div>
      </div>
    </article>
  );
}

function CampoTexto({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-bold text-texto">{label}</label>
      <input
        required
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-borde px-4 py-3 outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
      />
    </div>
  );
}

function descripcionRol(nombreRol) {
  const rol = String(nombreRol || "").toLowerCase();

  if (rol.includes("administrador")) {
    return "Acceso total a finanzas, usuarios y reportes.";
  }

  if (rol.includes("operador")) {
    return "Gestión de compras, inventario y pagos.";
  }

  if (rol.includes("visualizador")) {
    return "Solo lectura para consultas y auditorías.";
  }

  return "Rol personalizado del sistema.";
}

export default Usuarios;