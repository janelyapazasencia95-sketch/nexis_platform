import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  CreditCard,
  Map,
  BarChart3,
  Settings,
  UserCog,
} from "lucide-react";

const menuItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/proveedores", label: "Proveedores", icon: Users },
  { path: "/compras", label: "Compras", icon: ShoppingCart },
  { path: "/inventario", label: "Inventario", icon: Package },
  { path: "/pagos", label: "Pagos", icon: CreditCard },
  { path: "/mapa", label: "Mapa Perú", icon: Map },
  { path: "/reportes", label: "Reportes", icon: BarChart3 },
  { path: "/configuracion", label: "Configuración", icon: Settings },
  { path: "/usuarios", label: "Usuarios", icon: UserCog },
];

function Sidebar() {
  return (
    <aside className="w-72 min-h-screen bg-white border-r border-borde px-5 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-petroleo">NEXIS</h1>
        <p className="text-sm text-texto mt-1">
          Gestión de fibra de vicuña
        </p>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? "bg-petroleo text-white"
                    : "text-texto hover:bg-tarjeta"
                }`
              }
            >
              <Icon size={19} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;