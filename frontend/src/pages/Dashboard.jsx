import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Archive,
  Banknote,
  ClipboardList,
  CreditCard,
  FileText,
  RefreshCw,
  ShoppingCart,
  Users,
  WalletCards,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../services/api";

function Dashboard() {
  const navigate = useNavigate();

  const [resumen, setResumen] = useState(null);
  const [regiones, setRegiones] = useState([]);
  const [pagos, setPagos] = useState(null);
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargarDashboard = async () => {
    try {
      setCargando(true);
      setError("");

      const [
        respuestaResumen,
        respuestaRegiones,
        respuestaPagos,
        respuestaAlertas,
      ] = await Promise.all([
        api.get("/dashboard/resumen/"),
        api.get("/dashboard/compras-por-region/"),
        api.get("/dashboard/pagos-por-estado/"),
        api.get("/dashboard/alertas-stock/"),
      ]);

      setResumen(respuestaResumen.data);
      setRegiones(respuestaRegiones.data || []);
      setPagos(respuestaPagos.data);
      setAlertas(respuestaAlertas.data || []);
    } catch (error) {
      console.error(error);
      setError("No se pudo cargar el panel. Verifica que Django esté activo.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDashboard();
  }, []);

  const formatoSoles = (valor) => {
    const numero = Number(valor || 0);
    return `S/ ${numero.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatoKg = (valor) => {
    const numero = Number(valor || 0);
    return `${numero.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} kg`;
  };

  const formatoMiles = (valor) => {
    const numero = Number(valor || 0);

    if (numero >= 1000) {
      return `S/ ${(numero / 1000).toFixed(0)}k`;
    }

    return formatoSoles(numero);
  };

  const datosPagos = useMemo(() => {
    return [
      {
        name: "Pagado",
        value: Number(pagos?.pagado || 0),
      },
      {
        name: "Pendiente",
        value: Number(pagos?.pendiente || 0),
      },
    ];
  }, [pagos]);

  const tarjetas = [
    {
      titulo: "Total comprado",
      valor: formatoKg(resumen?.total_comprado_kg),
      indicador: "+12%",
      indicadorClase: "text-green-700",
      icono: ShoppingCart,
      cajaIcono: "bg-[#dce1ff] text-[#253a82]",
    },
    {
      titulo: "Total pagado",
      valor: formatoSoles(resumen?.total_pagado),
      indicador: formatoMiles(resumen?.total_pagado),
      indicadorClase: "text-green-700",
      icono: Banknote,
      cajaIcono: "bg-[#dce1ff] text-[#253a82]",
    },
    {
      titulo: "Deuda pendiente",
      valor: formatoSoles(resumen?.deuda_pendiente),
      indicador: `${resumen?.compras_pendientes || 0} Docs`,
      indicadorClase: "text-red-600",
      icono: WalletCards,
      cajaIcono: "bg-[#ffdad6] text-[#ba1a1a]",
    },
    {
      titulo: "Stock disponible",
      valor: formatoKg(resumen?.stock_disponible_kg),
      indicador: "En almacén",
      indicadorClase: "text-[#0b1c30]",
      icono: Archive,
      cajaIcono: "bg-[#e5deff] text-[#291575]",
    },
    {
      titulo: "Proveedores activos",
      valor: resumen?.proveedores_activos || 0,
      indicador: `+${resumen?.proveedores_activos || 0}`,
      indicadorClase: "text-green-700",
      icono: Users,
      cajaIcono: "bg-[#dce1ff] text-[#253a82]",
    },
  ];

  if (cargando) {
    return (
      <div className="rounded-xl border border-[#c5c5d2] bg-white p-8">
        <p className="font-semibold text-[#454651]">
          Cargando panel de control...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-white p-6">
        <div className="flex items-center gap-3 text-red-600">
          <AlertTriangle size={22} />
          <p className="font-semibold">{error}</p>
        </div>

        <button
          onClick={cargarDashboard}
          className="mt-4 flex items-center gap-2 rounded-lg bg-[#253a82] px-4 py-2 text-sm font-semibold text-white"
        >
          <RefreshCw size={16} />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-[32px] font-bold leading-tight text-[#07226b]">
            Panel de Control
          </h2>
          <p className="mt-1 text-[17px] text-[#454651]">
            Resumen operativo y financiero del inventario de fibra.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => navigate("/compras")}
            className="flex items-center gap-2 rounded-xl bg-[#253a82] px-7 py-4 text-[17px] font-bold text-white shadow-sm transition hover:bg-[#07226b]"
          >
            <ShoppingCart size={22} />
            Nueva compra
          </button>

          <button
            onClick={() => navigate("/pagos")}
            className="flex items-center gap-2 rounded-xl bg-[#198d20] px-7 py-4 text-[17px] font-bold text-white shadow-sm transition hover:bg-[#126818]"
          >
            <Banknote size={22} />
            Registrar pago
          </button>

          <button
            onClick={() => navigate("/compras")}
            className="flex items-center gap-2 rounded-xl bg-[#ffb800] px-7 py-4 text-[17px] font-bold text-[#0b1c30] shadow-sm transition hover:bg-[#f3aa00]"
          >
            <ClipboardList size={22} />
            Ver pendientes
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
        {tarjetas.map((tarjeta) => {
          const Icono = tarjeta.icono;

          return (
            <article
              key={tarjeta.titulo}
              className="min-h-[180px] rounded-xl border border-[#d3e4fe] bg-white p-7 shadow-sm"
            >
              <div className="mb-6 flex items-center justify-between">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${tarjeta.cajaIcono}`}
                >
                  <Icono size={24} strokeWidth={2.4} />
                </div>

                <span
                  className={`text-sm font-extrabold ${tarjeta.indicadorClase}`}
                >
                  {tarjeta.indicador}
                </span>
              </div>

              <p className="text-[17px] font-semibold text-[#454651]">
                {tarjeta.titulo}
              </p>

              <h3 className="mt-2 break-words text-[30px] font-extrabold leading-tight tracking-tight text-[#001b35]">
                {tarjeta.valor}
              </h3>
            </article>
          );
        })}
      </section>

      {alertas.length > 0 && (
        <section className="rounded-xl border border-[#ffdad6] bg-[#fff5f3] p-5">
          <div className="flex items-center gap-3 text-[#ba1a1a]">
            <AlertTriangle size={22} />
            <div>
              <p className="font-bold">
                {alertas.length} alerta(s) de stock bajo
              </p>
              <p className="text-sm">
                Existen lotes con menos de 50 kg disponibles.
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <article className="rounded-xl border border-[#d3e4fe] bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-[#07226b]">
                Compras por región
              </h3>
              <p className="text-sm text-[#454651]">
                Kilogramos confirmados por zona altoandina.
              </p>
            </div>

            <button
              onClick={cargarDashboard}
              className="flex items-center gap-2 rounded-lg bg-[#eff4ff] px-4 py-2 text-sm font-bold text-[#253a82]"
            >
              <RefreshCw size={16} />
              Actualizar
            </button>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regiones}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="region" />
                <YAxis />
                <Tooltip
                  formatter={(value) => formatoKg(value)}
                  labelStyle={{ color: "#0b1c30" }}
                />
                <Bar dataKey="total_kg" radius={[8, 8, 0, 0]}>
                  {regiones.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index % 2 === 0 ? "#253a82" : "#87a1fe"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-xl border border-[#d3e4fe] bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h3 className="text-xl font-bold text-[#07226b]">
              Estado financiero
            </h3>
            <p className="text-sm text-[#454651]">
              Comparación entre pagado y pendiente.
            </p>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={datosPagos}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  <Cell fill="#198d20" />
                  <Cell fill="#ba1a1a" />
                </Pie>
                <Tooltip formatter={(value) => formatoSoles(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between rounded-lg bg-green-50 p-3">
              <span className="font-bold text-green-700">Pagado</span>
              <span className="font-bold text-green-700">
                {formatoSoles(pagos?.pagado)}
              </span>
            </div>

            <div className="flex justify-between rounded-lg bg-red-50 p-3">
              <span className="font-bold text-red-700">Pendiente</span>
              <span className="font-bold text-red-700">
                {formatoSoles(pagos?.pendiente)}
              </span>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-xl border border-[#d3e4fe] bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-[#07226b]">
              Compras recientes
            </h3>
            <p className="text-sm text-[#454651]">
              Últimas operaciones registradas en el sistema.
            </p>
          </div>

          <button
            onClick={() => navigate("/compras")}
            className="flex items-center gap-2 rounded-lg bg-[#eff4ff] px-4 py-2 text-sm font-bold text-[#253a82]"
          >
            <FileText size={16} />
            Ver compras
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-sm">
            <thead>
              <tr className="bg-[#eff4ff] text-left text-[#454651]">
                <th className="rounded-l-lg px-4 py-3">Código</th>
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3">Región</th>
                <th className="px-4 py-3">Kg</th>
                <th className="px-4 py-3">Total</th>
                <th className="rounded-r-lg px-4 py-3">Estado</th>
              </tr>
            </thead>

            <tbody>
              {resumen?.compras_recientes?.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-[#454651]">
                    No hay compras recientes.
                  </td>
                </tr>
              ) : (
                resumen?.compras_recientes?.map((compra) => (
                  <tr
                    key={compra.codigo}
                    className="border-b border-[#e5eeff] hover:bg-[#f8f9ff]"
                  >
                    <td className="px-4 py-4 font-bold text-[#253a82]">
                      {compra.codigo}
                    </td>
                    <td className="px-4 py-4">{compra.proveedor}</td>
                    <td className="px-4 py-4">{compra.region}</td>
                    <td className="px-4 py-4">
                      {formatoKg(compra.kilogramos)}
                    </td>
                    <td className="px-4 py-4 font-bold">
                      {formatoSoles(compra.total)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-[#dce1ff] px-3 py-1 text-xs font-bold text-[#253a82]">
                        {compra.estado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;