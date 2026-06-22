function Header({ titulo }) {
  return (
    <header className="bg-white border-b border-borde px-8 py-5 flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-marino">{titulo}</h2>
        <p className="text-sm text-texto">
          Plataforma de gestión y trazabilidad de fibra de vicuña
        </p>
      </div>

      <div className="text-right">
        <p className="text-sm font-semibold text-texto">Administrador</p>
        <p className="text-xs text-gray-500">admin@nexis.pe</p>
      </div>
    </header>
  );
}

export default Header;