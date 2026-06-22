import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const titulos = {
  "/": "Dashboard",
  "/proveedores": "Proveedores",
  "/compras": "Compras",
  "/inventario": "Inventario",
  "/pagos": "Pagos",
  "/mapa": "Mapa Perú",
  "/reportes": "Reportes",
  "/configuracion": "Configuración",
  "/usuarios": "Usuarios",
};

function MainLayout() {
  const location = useLocation();
  const titulo = titulos[location.pathname] || "NEXIS";

  return (
    <div className="min-h-screen bg-fondo flex">
      <Sidebar />

      <main className="flex-1">
        <Header titulo={titulo} />

        <section className="p-8">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

export default MainLayout;