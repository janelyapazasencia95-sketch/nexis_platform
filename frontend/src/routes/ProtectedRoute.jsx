import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children }) {
  const { autenticado, cargandoSesion } = useAuth();

  if (cargandoSesion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fondo">
        <div className="rounded-xl border border-borde bg-white px-6 py-5 text-center shadow-sm">
          <p className="font-bold text-azul">Cargando NEXIS...</p>
          <p className="mt-1 text-sm text-textoSuave">
            Verificando sesión del usuario.
          </p>
        </div>
      </div>
    );
  }

  if (!autenticado) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;