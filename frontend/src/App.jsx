import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import Dashboard from "./pages/Dashboard";
import Proveedores from "./pages/Proveedores";
import Compras from "./pages/Compras";
import Inventario from "./pages/Inventario";
import Pagos from "./pages/Pagos";
import Mapa from "./pages/Mapa";
import Reportes from "./pages/Reportes";
import Configuracion from "./pages/Configuracion";
import Usuarios from "./pages/Usuarios";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="proveedores" element={<Proveedores />} />
          <Route path="compras" element={<Compras />} />
          <Route path="inventario" element={<Inventario />} />
          <Route path="pagos" element={<Pagos />} />
          <Route path="mapa" element={<Mapa />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="configuracion" element={<Configuracion />} />
          <Route path="usuarios" element={<Usuarios />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;