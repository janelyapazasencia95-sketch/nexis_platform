function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-borde rounded-2xl p-6">
        <h3 className="text-xl font-bold text-marino">Resumen general</h3>
        <p className="text-texto mt-2">
          Aquí se mostrarán los indicadores principales de compras, pagos, stock y proveedores.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-5">
        <div className="bg-white border border-borde rounded-2xl p-5">
          <p className="text-sm text-texto">Total comprado</p>
          <h4 className="text-2xl font-bold text-petroleo">0 kg</h4>
        </div>

        <div className="bg-white border border-borde rounded-2xl p-5">
          <p className="text-sm text-texto">Total pagado</p>
          <h4 className="text-2xl font-bold text-petroleo">S/ 0.00</h4>
        </div>

        <div className="bg-white border border-borde rounded-2xl p-5">
          <p className="text-sm text-texto">Stock disponible</p>
          <h4 className="text-2xl font-bold text-petroleo">0 kg</h4>
        </div>

        <div className="bg-white border border-borde rounded-2xl p-5">
          <p className="text-sm text-texto">Proveedores activos</p>
          <h4 className="text-2xl font-bold text-petroleo">0</h4>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;