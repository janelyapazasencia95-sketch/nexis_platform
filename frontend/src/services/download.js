export async function downloadFile(url, filename = "reporte.pdf") {
  const token =
    localStorage.getItem("nexis_token") ||
    sessionStorage.getItem("nexis_token") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  if (!token) {
    alert("Sesión expirada. Inicia sesión nuevamente.");
    window.location.href = "/login";
    return;
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Token ${token}`,
      },
    });

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("nexis_token");
      localStorage.removeItem("nexis_usuario");
      localStorage.removeItem("nexis_recordar");
      sessionStorage.removeItem("nexis_token");
      sessionStorage.removeItem("nexis_usuario");

      alert("Tu sesión expiró. Inicia sesión nuevamente.");
      window.location.href = "/login";
      return;
    }

    if (!response.ok) {
      const texto = await response.text().catch(() => "");
      console.error("Error descargando archivo:", response.status, texto);
      alert(`No se pudo descargar el archivo. Código: ${response.status}`);
      return;
    }

    const blob = await response.blob();

    if (!blob || blob.size === 0) {
      alert("El archivo descargado está vacío.");
      return;
    }

    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(objectUrl);
  } catch (error) {
    console.error("Error descargando archivo:", error);
    alert("Ocurrió un error al descargar el archivo.");
  }
}
