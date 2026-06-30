import { downloadFile } from "../services/download";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Clock3,
  CreditCard,
  Download,
  Edit,
  Eye,
  Filter,
  Landmark,
  PlusCircle,
  RefreshCw,
  Save,
  Search,
  Smartphone,
  Wallet,
  X,
} from "lucide-react";
import api from "../services/api";

const metodos = {
  EFECTIVO: {
    texto: "Efectivo",
    icono: Wallet,
  },
  TRANSFERENCIA: {
    texto: "Transferencia",
    icono: Landmark,
  },
  YAPE: {
    texto: "Yape",
    icono: Smartphone,
  },
  PLIN: {
    texto: "Plin",
    icono: Smartphone,
  },
  TARJETA_SIMULADA: {
    texto: "Tarjeta simulada",
    icono: CreditCard,
  },
};

function Pagos() {
  const [pagos, setPagos] = useState([]);
  const [compras, setCompras] = useState([]);

  const [buscar, setBuscar] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);

  const [formulario, setFormulario] = useState({
    compra: "",
    fecha_pago: "",
    monto: "",
    metodo: "EFECTIVO",
    estado: "PROCESADO",
    operacion: "",
    observacion: "",
  });

  const obtenerLista = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.results)) return data.results;
    return [];
  };

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError("");

      const [respuestaPagos, respuestaCompras] = await Promise.all([
        api.get("/pagos/"),
        api.get("/compras/"),
      ]);

      setPagos(obtenerLista(respuestaPagos.data));
      setCompras(obtenerLista(respuestaCompras.data));
    } catch (error) {
      console.error(error);
      setError("No se pudo cargar la información de pagos.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const pagosProcesados = pagos.filter((pago) => pago.estado === "PROCESADO");

  const comprasConfirmadas = compras.filter(
    (compra) => compra.estado === "CONFIRMADA"
  );

  const formatoSoles = (valor) => {
    const numero = Number(valor || 0);
    return `S/ ${numero.toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatoFecha = (valor) => {
    if (!valor) return "Sin fecha";

    return new Date(valor).toLocaleDateString("es-PE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const iniciales = (texto) => {
    if (!texto) return "PX";

    const partes = texto.trim().split(" ");

    if (partes.length === 1) {
      return partes[0].slice(0, 2).toUpperCase();
    }

    return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
  };

  const pagosDeCompra = (compraId) => {
    return pagosProcesados.filter(
      (pago) => String(pago.compra) === String(compraId)
    );
  };

  const totalPagadoCompra = (compraId) => {
    return pagosDeCompra(compraId).reduce(
      (suma, pago) => suma + Number(pago.monto || 0),
      0
    );
  };

  const ultimoPagoCompra = (compraId) => {
    const lista = pagosDeCompra(compraId);

    if (lista.length === 0) return null;

    return [...lista].sort(
      (a, b) => new Date(b.fecha_pago) - new Date(a.fecha_pago)
    )[0];
  };

  const obtenerEstadoFinanciero = (totalCompra, montoPagado) => {
    const saldo = Number(totalCompra || 0) - Number(montoPagado || 0);

    if (saldo <= 0) return "COMPLETADO";
    if (montoPagado > 0) return "PARCIAL";

    return "VENCIDO";
  };

  const filasCompras = useMemo(() => {
    return comprasConfirmadas.map((compra) => {
      const montoPagado = totalPagadoCompra(compra.id);
      const totalCompra = Number(compra.total || 0);
      const saldoPendiente = Math.max(totalCompra - montoPagado, 0);
      const estadoFinanciero = obtenerEstadoFinanciero(totalCompra, montoPagado);
      const ultimoPago = ultimoPagoCompra(compra.id);

      return {
        id: compra.id,
        codigo: compra.codigo,
        proveedor: compra.proveedor_nombre || "Sin proveedor",
        totalCompra,
        montoPagado,
        saldoPendiente,
        estadoFinanciero,
        metodo: ultimoPago?.metodo || "-",
        metodoTexto:
          metodos[ultimoPago?.metodo]?.texto ||
          ultimoPago?.metodo_texto ||
          "-",
        fechaUltimoPago: ultimoPago?.fecha_pago || null,
      };
    });
  }, [compras, pagos]);

  const filasFiltradas = useMemo(() => {
    return filasCompras.filter((fila) => {
      const texto = `
        ${fila.codigo || ""}
        ${fila.proveedor || ""}
        ${fila.estadoFinanciero || ""}
        ${fila.metodoTexto || ""}
      `.toLowerCase();

      const coincideBusqueda = texto.includes(buscar.toLowerCase());

      const coincideEstado =
        filtroEstado === "TODOS"
          ? true
          : fila.estadoFinanciero === filtroEstado;

      return coincideBusqueda && coincideEstado;
    });
  }, [filasCompras, buscar, filtroEstado]);

  const pagosParciales = filasCompras
    .filter((fila) => fila.estadoFinanciero === "PARCIAL")
    .reduce((suma, fila) => suma + Number(fila.montoPagado || 0), 0);

  const pagosCompletados = filasCompras
    .filter((fila) => fila.estadoFinanciero === "COMPLETADO")
    .reduce((suma, fila) => suma + Number(fila.totalCompra || 0), 0);

  const deudasVencidas = filasCompras
    .filter((fila) => fila.estadoFinanciero === "VENCIDO")
    .reduce((suma, fila) => suma + Number(fila.saldoPendiente || 0), 0);

  const comprasConSaldo = filasCompras.filter(
    (fila) => Number(fila.saldoPendiente || 0) > 0
  );

  const compraSeleccionada = filasCompras.find(
    (fila) => String(fila.id) === String(formulario.compra)
  );

  const saldoSeleccionado = compraSeleccionada?.saldoPendiente || 0;

  const totalPagosProcesados = pagosProcesados.length || 1;

  const porcentajeMetodo = (metodo) => {
    const cantidad = pagosProcesados.filter((pago) => pago.metodo === metodo).length;
    return Math.round((cantidad / totalPagosProcesados) * 100);
  };

  const porcentajeBilletera = () => {
    const cantidad = pagosProcesados.filter(
      (pago) => pago.metodo === "YAPE" || pago.metodo === "PLIN"
    ).length;

    return Math.round((cantidad / totalPagosProcesados) * 100);
  };

  const proximosVencimientos = comprasConSaldo
    .sort((a, b) => b.saldoPendiente - a.saldoPendiente)
    .slice(0, 3);

  const limpiarFiltros = () => {
    setBuscar("");
    setFiltroEstado("TODOS");
  };

  const cambiarFormulario = (campo, valor) => {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  };

  const abrirRegistrarPago = (compraId = "") => {
    const compraBase =
      filasCompras.find((fila) => String(fila.id) === String(compraId)) ||
      comprasConSaldo[0];

    setFormulario({
      compra: compraBase?.id || "",
      fecha_pago: new Date().toISOString().slice(0, 10),
      monto: "",
      metodo: "EFECTIVO",
      estado: "PROCESADO",
      operacion: "",
      observacion: "",
    });

    setModalAbierto(true);
  };

  const guardarPago = async (e) => {
    e.preventDefault();

    const monto = Number(formulario.monto || 0);

    if (!formulario.compra) {
      alert("Selecciona una compra.");
      return;
    }

    if (monto <= 0) {
      alert("El monto debe ser mayor a 0.");
      return;
    }

    if (monto > Number(saldoSeleccionado || 0)) {
      alert("El monto no puede superar el saldo pendiente.");
      return;
    }

    try {
      await api.post("/pagos/", {
        ...formulario,
        monto,
        estado: "PROCESADO",
      });

      setModalAbierto(false);
      await cargarDatos();
    } catch (error) {
      console.error(error);
      alert("No se pudo registrar el pago. Revisa que la compra esté confirmada y que el monto no exceda el saldo.");
    }
  };

  const exportarPDF = () => {
    downloadFile("/api/reportes/exportar-pagos-pdf/", "reporte_pagos.pdf");
  };

  const claseEstado = (estado) => {
    if (estado === "COMPLETADO") {
      return "bg-[#dcfce7] text-[#166534]";
    }

    if (estado === "PARCIAL") {
      return "bg-[#fef9c3] text-[#854d0e]";
    }

    return "bg-[#fee2e2] text-[#991b1b]";
  };

  const textoEstado = (estado) => {
    if (estado === "COMPLETADO") return "Completado";
    if (estado === "PARCIAL") return "Parcial";
    return "Vencido";
  };

  const colorSaldo = (estado) => {
    if (estado === "COMPLETADO") return "text-outline";
    if (estado === "PARCIAL") return "text-[#a16207]";
    return "text-error";
  };

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-[28px] font-bold leading-tight text-azul sm:text-[32px]">
            Gestión de Pagos
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-textoSuave sm:text-lg">
            Supervisión de transacciones y estados financieros con proveedores de fibra.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            onClick={() => abrirRegistrarPago()}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#166534] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#14532d]"
          >
            <PlusCircle size={19} />
            Registrar pago
          </button>

          <button
            onClick={() => setFiltroEstado("PARCIAL")}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#a16207] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#854d0e]"
          >
            <Wallet size={19} />
            Pago parcial
          </button>

          <button
            onClick={() => setFiltroEstado("VENCIDO")}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#991b1b] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#7f1d1d]"
          >
            <AlertTriangle size={19} />
            Deuda vencida
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <article className="rounded-xl border border-borde bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-azulClaro text-azul">
              <Clock3 size={22} />
            </span>
            <span className="rounded-full bg-azulSuave px-3 py-1 text-xs font-bold text-azul">
              Mes actual
            </span>
          </div>

          <p className="text-sm font-bold uppercase tracking-wider text-textoSuave">
            Pagos parciales
          </p>
          <h3 className="mt-1 text-2xl font-extrabold text-azul">
            {formatoSoles(pagosParciales)}
          </h3>

          <div className="mt-5 h-1.5 w-full rounded-full bg-azulSuave">
            <div className="h-1.5 w-[65%] rounded-full bg-secondary" />
          </div>
        </article>

        <article className="rounded-xl border border-borde bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-[#166534]">
              <CheckCircle size={22} />
            </span>
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-[#166534]">
              Datos actuales
            </span>
          </div>

          <p className="text-sm font-bold uppercase tracking-wider text-textoSuave">
            Pagos completados
          </p>
          <h3 className="mt-1 text-2xl font-extrabold text-[#166534]">
            {formatoSoles(pagosCompletados)}
          </h3>

          <div className="mt-5 h-1.5 w-full rounded-full bg-azulSuave">
            <div className="h-1.5 w-[90%] rounded-full bg-[#166534]" />
          </div>
        </article>

        <article className="rounded-xl border border-borde bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-rojoClaro text-error">
              <AlertTriangle size={22} />
            </span>
            <span className="rounded-full bg-rojoClaro px-3 py-1 text-xs font-bold text-error">
              Crítico
            </span>
          </div>

          <p className="text-sm font-bold uppercase tracking-wider text-textoSuave">
            Deudas vencidas
          </p>
          <h3 className="mt-1 text-2xl font-extrabold text-error">
            {formatoSoles(deudasVencidas)}
          </h3>

          <div className="mt-5 h-1.5 w-full rounded-full bg-rojoClaro">
            <div className="h-1.5 w-[30%] rounded-full bg-error" />
          </div>
        </article>
      </section>

      <section className="rounded-xl border border-borde bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-3 text-gris" size={18} />
            <input
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              placeholder="Buscar por ID de compra o proveedor..."
              className="w-full rounded-xl border border-transparent bg-azulSuave py-2.5 pl-10 pr-4 text-sm outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
            />
          </div>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="rounded-xl border border-borde bg-azulSuave px-4 py-2.5 text-sm outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="PARCIAL">Parcial</option>
            <option value="COMPLETADO">Completado</option>
            <option value="VENCIDO">Vencido</option>
          </select>

          <button
            onClick={limpiarFiltros}
            className="flex items-center justify-center gap-2 rounded-xl border border-borde px-4 py-2.5 text-sm font-bold text-azul hover:bg-azulSuave"
          >
            <Filter size={17} />
            Limpiar filtros
          </button>
        </div>
      </section>

      {error && (
        <section className="rounded-xl border border-red-200 bg-white p-5">
          <div className="flex items-center gap-3 text-error">
            <AlertTriangle size={22} />
            <p className="font-semibold">{error}</p>
          </div>

          <button
            onClick={cargarDatos}
            className="mt-4 flex items-center gap-2 rounded-lg bg-azul2 px-4 py-2 text-sm font-bold text-white"
          >
            <RefreshCw size={16} />
            Reintentar
          </button>
        </section>
      )}

      <section className="overflow-hidden rounded-xl border border-borde bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-borde bg-white p-6">
          <h3 className="text-lg font-bold text-azul">
            Historial de Transacciones
          </h3>

          <div className="flex gap-3">
            <button
              onClick={() => setFiltroEstado("TODOS")}
              className="rounded-lg border border-borde p-2 text-textoSuave hover:bg-azulSuave"
              title="Filtrar"
            >
              <Filter size={20} />
            </button>

            <button
              onClick={exportarPDF}
              className="rounded-lg border border-borde p-2 text-textoSuave hover:bg-azulSuave"
              title="Exportar PDF"
            >
              <Download size={20} />
            </button>
          </div>
        </div>

        <div className="custom-scrollbar overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-azulSuave text-textoSuave">
                <th className="px-6 py-4 font-bold">Compra (ID)</th>
                <th className="px-6 py-4 font-bold">Proveedor</th>
                <th className="px-6 py-4 text-right font-bold">Total Compra</th>
                <th className="px-6 py-4 text-right font-bold">Monto Pagado</th>
                <th className="px-6 py-4 text-right font-bold">Saldo Pendiente</th>
                <th className="px-6 py-4 font-bold">Estado</th>
                <th className="px-6 py-4 font-bold">Método</th>
                <th className="px-6 py-4 text-center font-bold">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-borde">
              {cargando ? (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center text-textoSuave">
                    Cargando pagos...
                  </td>
                </tr>
              ) : filasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center text-textoSuave">
                    No se encontraron transacciones.
                  </td>
                </tr>
              ) : (
                filasFiltradas.map((fila) => {
                  const MetodoIcono = metodos[fila.metodo]?.icono || Wallet;

                  return (
                    <tr key={fila.id} className="transition hover:bg-azulSuave/50">
                      <td className="px-6 py-5 font-bold text-azul">
                        #{fila.codigo}
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-azulClaro text-xs font-bold text-azul">
                            {iniciales(fila.proveedor)}
                          </div>
                          <span className="font-semibold text-texto">
                            {fila.proveedor}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-right font-semibold text-texto">
                        {formatoSoles(fila.totalCompra)}
                      </td>

                      <td className="px-6 py-5 text-right font-semibold text-[#166534]">
                        {formatoSoles(fila.montoPagado)}
                      </td>

                      <td
                        className={`px-6 py-5 text-right font-bold ${colorSaldo(
                          fila.estadoFinanciero
                        )}`}
                      >
                        {formatoSoles(fila.saldoPendiente)}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${claseEstado(
                            fila.estadoFinanciero
                          )}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {textoEstado(fila.estadoFinanciero)}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-sm text-textoSuave">
                          <MetodoIcono size={16} />
                          <span>{fila.metodoTexto}</span>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() =>
                              alert(
                                `Compra: ${fila.codigo}\nProveedor: ${fila.proveedor}\nSaldo: ${formatoSoles(
                                  fila.saldoPendiente
                                )}`
                              )
                            }
                            className="rounded p-1.5 text-textoSuave hover:text-azul"
                            title="Ver detalle"
                          >
                            <Eye size={20} />
                          </button>

                          <button
                            onClick={() => abrirRegistrarPago(fila.id)}
                            disabled={fila.saldoPendiente <= 0}
                            className="rounded p-1.5 text-textoSuave hover:text-secondary disabled:cursor-not-allowed disabled:opacity-40"
                            title="Registrar pago"
                          >
                            <Edit size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 bg-azulSuave px-6 py-4 text-sm text-gris sm:flex-row sm:items-center sm:justify-between">
          <span>
            Mostrando {filasFiltradas.length} de {filasCompras.length} transacciones
          </span>

          <button
            onClick={cargarDatos}
            className="flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 font-bold text-azul"
          >
            <RefreshCw size={16} />
            Actualizar
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <article className="rounded-xl border border-borde bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-bold text-azul">
            Métodos de Pago Frecuentes
          </h3>

          <div className="space-y-5">
            <MetodoFrecuente
              icono={<Landmark size={21} />}
              titulo="Transferencia Bancaria"
              porcentaje={porcentajeMetodo("TRANSFERENCIA")}
            />

            <MetodoFrecuente
              icono={<Wallet size={21} />}
              titulo="Efectivo"
              porcentaje={porcentajeMetodo("EFECTIVO")}
            />

            <MetodoFrecuente
              icono={<Smartphone size={21} />}
              titulo="Billetera Digital (Yape/Plin)"
              porcentaje={porcentajeBilletera()}
            />
          </div>
        </article>

        <article className="rounded-xl border border-borde bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-bold text-azul">
            Próximos Vencimientos
          </h3>

          <div className="space-y-3">
            {proximosVencimientos.length === 0 ? (
              <p className="text-sm text-textoSuave">
                No hay vencimientos pendientes.
              </p>
            ) : (
              proximosVencimientos.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between rounded p-4 ${
                    index === 0
                      ? "border-l-4 border-error bg-rojoClaro/30"
                      : index === 1
                        ? "border-l-4 border-secondary bg-azulSuave"
                        : "border-l-4 border-gris bg-azulSuave/70"
                  }`}
                >
                  <div>
                    <p
                      className={`font-bold ${
                        index === 0 ? "text-error" : "text-azul"
                      }`}
                    >
                      {item.proveedor}
                    </p>
                    <p className="text-xs text-gris">
                      Pendiente de pago
                    </p>
                  </div>

                  <p
                    className={`font-bold ${
                      index === 0 ? "text-error" : "text-azul"
                    }`}
                  >
                    {formatoSoles(item.saldoPendiente)}
                  </p>
                </div>
              ))
            )}
          </div>

          <button className="mt-6 w-full py-2 text-sm font-bold text-azul hover:underline">
            Ver calendario completo
          </button>
        </article>
      </section>

      {modalAbierto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
          <div className="custom-scrollbar max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-azul">
                  Registrar pago
                </h3>
                <p className="mt-1 text-sm text-textoSuave">
                  Registra un abono para una compra confirmada.
                </p>
              </div>

              <button
                onClick={() => setModalAbierto(false)}
                className="rounded-lg p-2 text-textoSuave hover:bg-azulSuave"
              >
                <X size={22} />
              </button>
            </div>

            <form
              onSubmit={guardarPago}
              className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-bold text-texto">
                  Compra
                </label>
                <select
                  required
                  value={formulario.compra}
                  onChange={(e) => cambiarFormulario("compra", e.target.value)}
                  className="w-full rounded-lg border border-borde px-4 py-3 outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
                >
                  <option value="">Seleccionar compra</option>
                  {comprasConSaldo.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.codigo} - {item.proveedor} - Saldo{" "}
                      {formatoSoles(item.saldoPendiente)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-texto">
                  Fecha de pago
                </label>
                <input
                  required
                  type="date"
                  value={formulario.fecha_pago}
                  onChange={(e) =>
                    cambiarFormulario("fecha_pago", e.target.value)
                  }
                  className="w-full rounded-lg border border-borde px-4 py-3 outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-texto">
                  Método
                </label>
                <select
                  value={formulario.metodo}
                  onChange={(e) => cambiarFormulario("metodo", e.target.value)}
                  className="w-full rounded-lg border border-borde px-4 py-3 outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="YAPE">Yape</option>
                  <option value="PLIN">Plin</option>
                  <option value="TARJETA_SIMULADA">Tarjeta simulada</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-texto">
                  Monto
                </label>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formulario.monto}
                  onChange={(e) => cambiarFormulario("monto", e.target.value)}
                  className="w-full rounded-lg border border-borde px-4 py-3 outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-texto">
                  Saldo pendiente
                </label>
                <div className="rounded-lg border border-borde bg-azulSuave px-4 py-3 font-bold text-azul">
                  {formatoSoles(saldoSeleccionado)}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-texto">
                  N° operación
                </label>
                <input
                  value={formulario.operacion}
                  onChange={(e) =>
                    cambiarFormulario("operacion", e.target.value)
                  }
                  placeholder="Opcional"
                  className="w-full rounded-lg border border-borde px-4 py-3 outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-texto">
                  Estado
                </label>
                <div className="rounded-lg border border-borde bg-green-50 px-4 py-3 font-bold text-[#166534]">
                  Procesado
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-bold text-texto">
                  Observación
                </label>
                <textarea
                  rows="3"
                  value={formulario.observacion}
                  onChange={(e) =>
                    cambiarFormulario("observacion", e.target.value)
                  }
                  className="w-full rounded-lg border border-borde px-4 py-3 outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
                />
              </div>

              <div className="mt-3 flex flex-col gap-3 md:col-span-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="rounded-lg border border-borde px-5 py-3 text-sm font-bold text-textoSuave hover:bg-azulSuave"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 rounded-lg bg-azul px-5 py-3 text-sm font-bold text-white hover:bg-azul2"
                >
                  <Save size={18} />
                  Guardar pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MetodoFrecuente({ icono, titulo, porcentaje }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-azul">{icono}</span>

      <div className="flex-1">
        <div className="mb-1 flex justify-between text-sm font-bold text-texto">
          <span>{titulo}</span>
          <span>{porcentaje}%</span>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-azulSuave">
          <div
            className="h-full rounded-full bg-azul"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default Pagos;