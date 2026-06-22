import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  CreditCard,
  Package,
  Map,
  BarChart3,
  Settings,
  User,
  Bell,
  Search,
  LogOut,
  CircleDot,
} from "lucide-react";

const menuItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/proveedores", label: "Proveedores", icon: Users },
  { path: "/compras", label: "Compras", icon: ShoppingCart },
  { path: "/pagos", label: "Pagos", icon: CreditCard },
  { path: "/inventario", label: "Inventario", icon: Package },
  { path: "/mapa", label: "Mapa Perú", icon: Map },
  { path: "/reportes", label: "Reportes", icon: BarChart3 },
  { path: "/configuracion", label: "Configuración", icon: Settings },
  { path: "/usuarios", label: "Usuarios", icon: User },
];

function MainLayout() {
  return (
    <div className="min-h-screen bg-background text-on-surface font-jakarta">
      <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-white px-4 py-6 shadow-sm">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
            <CircleDot size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-primary">NEXIS</h1>
            <p className="text-[10px] uppercase tracking-widest text-outline">
              Vicuña Fiber Management
            </p>
          </div>
        </div>

        <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-surface-container-low text-primary scale-[0.98]"
                      : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 right-0 top-0 w-1 rounded-l-full bg-primary" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-6 rounded-xl border border-outline-variant/30 bg-surface-container-low p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container font-bold text-white">
              AD
            </div>

            <div>
              <p className="text-sm font-bold text-on-surface">
                Administrador
              </p>
              <p className="text-[10px] uppercase tracking-wider text-on-surface-variant">
                Nexis HQ
              </p>
            </div>
          </div>
        </div>
      </aside>

      <header className="fixed right-0 top-0 z-40 flex h-16 w-[calc(100%-256px)] items-center justify-between bg-white/90 px-8 shadow-sm backdrop-blur-md">
        <div className="flex w-96 items-center rounded-full border border-outline-variant/20 bg-surface-container-low px-4 py-2">
          <Search size={20} className="text-on-surface-variant" />
          <input
            className="ml-2 w-full border-none bg-transparent text-sm outline-none focus:ring-0"
            placeholder="Buscar proveedores, compras o pagos..."
          />
        </div>

        <div className="flex items-center gap-5">
          <button className="relative text-on-surface-variant hover:text-primary">
            <Bell size={21} />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white">
              3
            </span>
          </button>

          <div className="h-6 w-px bg-outline-variant/40" />

          <span className="text-sm font-semibold text-on-surface">
            Administrador
          </span>

          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-container">
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="ml-64 pt-16">
        <div className="custom-scrollbar min-h-[calc(100vh-64px)] overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default MainLayout;