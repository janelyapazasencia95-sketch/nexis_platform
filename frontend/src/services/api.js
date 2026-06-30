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

api.interceptors.request.use((config) => {
  const token = obtenerToken();

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Token ${token}`;
  }

  return config;
});

export default api;
