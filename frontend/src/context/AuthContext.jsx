import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

function limpiarSesionGuardada() {
  localStorage.removeItem("nexis_usuario");
  localStorage.removeItem("nexis_token");
  localStorage.removeItem("nexis_recordar");

  sessionStorage.removeItem("nexis_usuario");
  sessionStorage.removeItem("nexis_token");
}

function obtenerUsuarioGuardado() {
  return (
    localStorage.getItem("nexis_usuario") ||
    sessionStorage.getItem("nexis_usuario")
  );
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);

  useEffect(() => {
    const usuarioGuardado = obtenerUsuarioGuardado();

    if (usuarioGuardado) {
      try {
        setUsuario(JSON.parse(usuarioGuardado));
      } catch (error) {
        console.error("Error leyendo sesión guardada:", error);
        limpiarSesionGuardada();
      }
    }

    setCargandoSesion(false);
  }, []);

  const login = async (username, password, recordar = false) => {
    const respuesta = await api.post("/usuarios/login/", {
      username,
      password,
    });

    const usuarioData = respuesta.data.usuario;
    const token = respuesta.data.token;

    if (!usuarioData || !token) {
      throw new Error("El backend no devolvió usuario o token.");
    }

    limpiarSesionGuardada();

    const storage = recordar ? localStorage : sessionStorage;

    storage.setItem("nexis_token", token);
    storage.setItem("nexis_usuario", JSON.stringify(usuarioData));

    if (recordar) {
      localStorage.setItem("nexis_recordar", "true");
    }

    setUsuario(usuarioData);

    return usuarioData;
  };

  const logout = async () => {
    try {
      await api.post("/usuarios/logout/");
    } catch (error) {
      console.warn("No se pudo cerrar sesión en backend:", error);
    } finally {
      limpiarSesionGuardada();
      setUsuario(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        login,
        logout,
        cargandoSesion,
        autenticado: !!usuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
