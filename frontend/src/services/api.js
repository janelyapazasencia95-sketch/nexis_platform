import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

function obtenerToken() {
  return (
    localStorage.getItem("nexis_token") ||
    sessionStorage.getItem("nexis_token")
  );
}

function limpiarSesion() {
  localStorage.removeItem("nexis_usuario");
  localStorage.removeItem("nexis_token");
  localStorage.removeItem("nexis_recordar");

  sessionStorage.removeItem("nexis_usuario");
  sessionStorage.removeItem("nexis_token");
}

api.interceptors.request.use((config) => {
  const token = obtenerToken();

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Token ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";

    const esLogin = url.includes("/usuarios/login/");

    if ((status === 401 || status === 403) && !esLogin) {
      limpiarSesion();

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
