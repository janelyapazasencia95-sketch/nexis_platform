import { useEffect, useState } from "react";
import api from "../services/api";
import {
  Package,
  CreditCard,
  Warehouse,
  Users,
  AlertCircle,
} from "lucide-react";

function Dashboard() {
  const [resumen, setResumen] = useState(null);
  const [regiones, setRegiones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarDashboard();
  }, []);

  const cargarDashboard = async () => {
    try {
      setCargando(true);

      const respuestaResumen = await api.get("/dashboard/resumen/");
      const respuestaRegiones = await api.get("/dashboard/compras-por-region/");

      setResumen(respuestaResumen.data);
      setRegiones(respuestaRegiones.data);
      setError("");
    } catch (error) {
      console.error(error);
      setError("No se pudo conectar con el backend Django.");
    } finally {
      setCargando(false);
    }
  };

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

  if (cargando) {
    return (
      <div className="bg-white border border-borde rounded-2xl p-6">
        <p className="text-texto">Cargando dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-borde rounded-2xl p-6">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle size={22} />
          <p>{error}</p>
        </div>

        <p className="text-sm text-texto mt-3">
          Verifica que Django esté corriendo en http://127.0.0.1:8000/
        </p>
      </div>
    );
  }

  const tarjetas = [
    {
      titulo: "Total comprado",
      valor: formatoKg(resumen?.total_comprado_kg),
      icono: Package,
    },
    {
      titulo: "Total pagado",
      valor: formatoSoles(resumen?.total_pagado),
      icono: CreditCard,
    },
    {
      titulo: "Stock disponible",
      valor: formatoKg(resumen?.stock_disponible_kg),
      icono: Warehouse,
    },
    {
      titulo: "Proveedores activos",
      valor: resumen?.proveedores_activos || 0,
      icono: Users,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white border border-borde rounded-2xl p-6">
        <h3 className="text-xl font-bold text-marino">Resumen general</h3>
        <p className="text-texto mt-2">
          Indicadores principales de compras, pagos, inventario y proveedores.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-5">
        {tarjetas.map((tarjeta) => {
          const Icono = tarjeta.icono;

          return (
            <div
              key={tarjeta.titulo}
              className="bg-white border border-borde rounded-2xl p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-texto">{tarjeta.titulo}</p>
                <Icono className="text-petroleo" size={22} />
              </div>

              <h4 className="text-2xl font-bold text-petroleo mt-3">
                {tarjeta.valor}
              </h4>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-borde rounded-2xl p-6">
          <h3 className="text-lg font-bold text-marino mb-4">
            Estado financiero
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-borde pb-2">
              <span className="text-texto">Valor total de compras</span>
              <span className="font-semibold text-marino">
                {formatoSoles(resumen?.total_compras)}
              </span>
            </div>

            <div className="flex justify-between border-b border-borde pb-2">
              <span className="text-texto">Total pagado</span>
              <span className="font-semibold text-green-700">
                {formatoSoles(resumen?.total_pagado)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-texto">Deuda pendiente</span>
              <span className="font-semibold text-red-700">
                {formatoSoles(resumen?.deuda_pendiente)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-borde rounded-2xl p-6">
          <h3 className="text-lg font-bold text-marino mb-4">
            Compras por región
          </h3>

          <div className="space-y-3">
            {regiones.length === 0 ? (
              <p className="text-sm text-texto">
                Todavía no hay compras confirmadas por región.
              </p>
            ) : (
              regiones.map((item) => (
                <div
                  key={item.region}
                  className="flex items-center justify-between border-b border-borde pb-2"
                >
                  <div>
                    <p className="font-semibold text-marino">{item.region}</p>
                    <p className="text-xs text-texto">
                      {item.cantidad} compras registradas
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-petroleo">
                      {formatoKg(item.total_kg)}
                    </p>
                    <p className="text-xs text-texto">
                      {formatoSoles(item.total_monto)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-borde rounded-2xl p-6">
        <h3 className="text-lg font-bold text-marino mb-4">
          Compras recientes
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-borde text-left text-texto">
                <th className="py-3">Código</th>
                <th className="py-3">Proveedor</th>
                <th className="py-3">Región</th>
                <th className="py-3">Kg</th>
                <th className="py-3">Total</th>
                <th className="py-3">Estado</th>
              </tr>
            </thead>

            <tbody>
              {resumen?.compras_recientes?.map((compra) => (
                <tr key={compra.codigo} className="border-b border-borde">
                  <td className="py-3 font-semibold text-marino">
                    {compra.codigo}
                  </td>
                  <td className="py-3">{compra.proveedor}</td>
                  <td className="py-3">{compra.region}</td>
                  <td className="py-3">{formatoKg(compra.kilogramos)}</td>
                  <td className="py-3">{formatoSoles(compra.total)}</td>
                  <td className="py-3">{compra.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;