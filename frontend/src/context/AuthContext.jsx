import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem("nexis_usuario");

    if (usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
    }

    setCargandoSesion(false);
  }, []);

  const login = async (username, password) => {
    const respuesta = await api.post("/usuarios/login/", {
      username,
      password,
    });

    const usuarioData = respuesta.data.usuario;
    const token = respuesta.data.token;

    if (!usuarioData) {
      throw new Error("El backend no devolvió usuario.");
    }

    if (token) {
      localStorage.setItem("nexis_token", token);
    }

    localStorage.setItem("nexis_usuario", JSON.stringify(usuarioData));
    setUsuario(usuarioData);

    return usuarioData;
  };

  const logout = () => {
    localStorage.removeItem("nexis_usuario");
    localStorage.removeItem("nexis_token");
    localStorage.removeItem("nexis_recordar");
    setUsuario(null);
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