import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Archive,
  Banknote,
  ClipboardList,
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
      indicador: "Según registros",
      indicadorClase: "text-textoSuave",
      icono: ShoppingCart,
      cajaIcono: "bg-azulClaro text-azul2",
    },
    {
      titulo: "Total pagado",
      valor: formatoSoles(resumen?.total_pagado),
      indicador: formatoMiles(resumen?.total_pagado),
      indicadorClase: "text-green-700",
      icono: Banknote,
      cajaIcono: "bg-azulClaro text-azul2",
    },
    {
      titulo: "Deuda pendiente",
      valor: formatoSoles(resumen?.deuda_pendiente),
      indicador: `${resumen?.compras_pendientes || 0} Docs`,
      indicadorClase: "text-red-600",
      icono: WalletCards,
      cajaIcono: "bg-rojoClaro text-rojo",
    },
    {
      titulo: "Stock disponible",
      valor: formatoKg(resumen?.stock_disponible_kg),
      indicador: "En almacén",
      indicadorClase: "text-texto",
      icono: Archive,
      cajaIcono: "bg-moradoClaro text-morado",
    },
    {
      titulo: "Proveedores activos",
      valor: resumen?.proveedores_activos || 0,
      indicador: `+${resumen?.proveedores_activos || 0}`,
      indicadorClase: "text-green-700",
      icono: Users,
      cajaIcono: "bg-azulClaro text-azul2",
    },
  ];

  if (cargando) {
    return (
      <div className="rounded-xl border border-borde bg-white p-8">
        <p className="font-semibold text-textoSuave">
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
          className="mt-4 flex items-center gap-2 rounded-lg bg-azul2 px-4 py-2 text-sm font-semibold text-white"
        >
          <RefreshCw size={16} />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-[28px] font-bold leading-tight text-azul sm:text-[32px]">
            Panel de Control
          </h2>
          <p className="mt-1 text-sm text-textoSuave sm:text-[17px]">
            Resumen operativo y financiero del inventario de fibra.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 xl:w-auto">
          <button
            onClick={() => navigate("/compras")}
            className="flex items-center justify-center gap-2 rounded-xl bg-azul2 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-azul sm:px-7 sm:py-4 sm:text-[17px]"
          >
            <ShoppingCart size={22} />
            Nueva compra
          </button>

          <button
            onClick={() => navigate("/pagos")}
            className="flex items-center justify-center gap-2 rounded-xl bg-verde px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-green-800 sm:px-7 sm:py-4 sm:text-[17px]"
          >
            <Banknote size={22} />
            Registrar pago
          </button>

          <button
            onClick={() => navigate("/compras")}
            className="flex items-center justify-center gap-2 rounded-xl bg-amarillo px-5 py-3 text-sm font-bold text-texto shadow-sm transition hover:bg-yellow-500 sm:px-7 sm:py-4 sm:text-[17px]"
          >
            <ClipboardList size={22} />
            Ver pendientes
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {tarjetas.map((tarjeta) => {
          const Icono = tarjeta.icono;

          return (
            <article
              key={tarjeta.titulo}
              className="min-h-[170px] rounded-xl border border-borde bg-white p-6 shadow-sm sm:min-h-[180px] sm:p-7"
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

              <p className="text-base font-semibold text-textoSuave sm:text-[17px]">
                {tarjeta.titulo}
              </p>

              <h3 className="mt-2 break-words text-[24px] font-extrabold leading-tight tracking-tight text-[#001b35] sm:text-[28px] xl:text-[30px]">
                {tarjeta.valor}
              </h3>
            </article>
          );
        })}
      </section>

      {alertas.length > 0 && (
        <section className="rounded-xl border border-rojoClaro bg-[#fff5f3] p-5">
          <div className="flex items-center gap-3 text-rojo">
            <AlertTriangle size={22} />
            <div>
              <p className="font-bold">
                {alertas.length} alerta(s) de stock bajo
              </p>
              <p className="text-sm">
                Existen lotes por debajo del umbral configurado.
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <article className="rounded-xl border border-borde bg-white p-5 shadow-sm sm:p-6 xl:col-span-2">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-bold text-azul">
                Compras por región
              </h3>
              <p className="text-sm text-textoSuave">
                Kilogramos confirmados por zona altoandina.
              </p>
            </div>

            <button
              onClick={cargarDashboard}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-azulSuave px-4 py-2 text-sm font-bold text-azul2 sm:w-auto"
            >
              <RefreshCw size={16} />
              Actualizar
            </button>
          </div>

          <div className="h-72 sm:h-80">
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
                      fill={index % 2 === 0 ? "#253A82" : "#87A1FE"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-xl border border-borde bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h3 className="text-xl font-bold text-azul">
              Estado financiero
            </h3>
            <p className="text-sm text-textoSuave">
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
                  <Cell fill="#198D20" />
                  <Cell fill="#BA1A1A" />
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

      <section className="rounded-xl border border-borde bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-bold text-azul">
              Compras recientes
            </h3>
            <p className="text-sm text-textoSuave">
              Últimas operaciones registradas en el sistema.
            </p>
          </div>

          <button
            onClick={() => navigate("/compras")}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-azulSuave px-4 py-2 text-sm font-bold text-azul2 sm:w-auto"
          >
            <FileText size={16} />
            Ver compras
          </button>
        </div>

        <div className="custom-scrollbar overflow-x-auto">
          <table className="w-full min-w-[850px] text-sm">
            <thead>
              <tr className="bg-azulSuave text-left text-textoSuave">
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
                  <td colSpan="6" className="py-8 text-center text-textoSuave">
                    No hay compras recientes.
                  </td>
                </tr>
              ) : (
                resumen?.compras_recientes?.map((compra) => (
                  <tr
                    key={compra.codigo}
                    className="border-b border-[#e5eeff] hover:bg-fondo"
                  >
                    <td className="px-4 py-4 font-bold text-azul2">
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
                      <span className="rounded-full bg-azulClaro px-3 py-1 text-xs font-bold text-azul2">
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