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

    const data = respuesta.data;

    const usuarioData =
      data.usuario ||
      data.user ||
      data.data ||
      {
        username,
        nombre: username,
      };

    if (data.token) {
      localStorage.setItem("nexis_token", data.token);
    }

    localStorage.setItem("nexis_usuario", JSON.stringify(usuarioData));
    setUsuario(usuarioData);

    return usuarioData;
  };

  const logout = () => {
    localStorage.removeItem("nexis_usuario");
    localStorage.removeItem("nexis_token");
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