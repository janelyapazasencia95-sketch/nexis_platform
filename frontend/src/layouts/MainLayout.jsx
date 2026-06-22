import { useState } from "react";
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
  Menu,
  X,
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
  const [menuAbierto, setMenuAbierto] = useState(false);

  const cerrarMenu = () => {
    setMenuAbierto(false);
  };

  return (
    <div className="min-h-screen bg-fondo font-jakarta text-texto">
      {menuAbierto && (
        <div
          onClick={cerrarMenu}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-white px-4 py-6 shadow-sm transition-transform duration-300 lg:translate-x-0 ${
          menuAbierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between gap-3 px-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-azul text-white">
              <CircleDot size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-azul">NEXIS</h1>
              <p className="text-[10px] uppercase tracking-widest text-gris">
                Vicuña Fiber Management
              </p>
            </div>
          </div>

          <button
            onClick={cerrarMenu}
            className="rounded-lg p-2 text-textoSuave hover:bg-azulSuave lg:hidden"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                onClick={cerrarMenu}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-azulSuave text-azul"
                      : "text-textoSuave hover:bg-azulClaro/60 hover:text-azul"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 right-0 top-0 w-1 rounded-l-full bg-azul" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-6 rounded-xl border border-borde bg-azulSuave p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-azul2 font-bold text-white">
              AD
            </div>

            <div>
              <p className="text-sm font-bold text-texto">Administrador</p>
              <p className="text-[10px] uppercase tracking-wider text-textoSuave">
                Nexis HQ
              </p>
            </div>
          </div>
        </div>
      </aside>

      <header className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between bg-white/90 px-4 shadow-sm backdrop-blur-md lg:left-64 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuAbierto(true)}
            className="rounded-lg p-2 text-azul hover:bg-azulSuave lg:hidden"
          >
            <Menu size={24} />
          </button>

          <div className="hidden w-72 items-center rounded-full border border-borde bg-azulSuave px-4 py-2 sm:flex lg:w-96">
            <Search size={20} className="text-textoSuave" />
            <input
              className="ml-2 w-full border-none bg-transparent text-sm outline-none"
              placeholder="Buscar..."
            />
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <button className="relative text-textoSuave hover:text-azul">
            <Bell size={21} />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rojo text-[10px] font-bold text-white">
              3
            </span>
          </button>

          <div className="hidden h-6 w-px bg-borde sm:block" />

          <span className="hidden text-sm font-semibold text-texto md:inline">
            Administrador
          </span>

          <button className="hidden items-center gap-2 rounded-lg bg-azul px-4 py-2 text-sm font-semibold text-white transition hover:bg-azul2 sm:flex">
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="pt-16 lg:ml-64">
        <div className="custom-scrollbar min-h-[calc(100vh-64px)] overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default MainLayout;