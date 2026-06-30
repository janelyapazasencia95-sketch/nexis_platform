import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);

    this.state = {
      tieneError: false,
      mensaje: "",
    };
  }

  static getDerivedStateFromError(error) {
    return {
      tieneError: true,
      mensaje: error?.message || "Error inesperado en la aplicación.",
    };
  }

  componentDidCatch(error, info) {
    console.error("Error capturado por ErrorBoundary:", error, info);
  }

  recargarPagina = () => {
    window.location.reload();
  };

  render() {
    if (this.state.tieneError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-fondo px-5">
          <section className="w-full max-w-lg rounded-2xl border border-borde bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-rojoClaro text-rojo">
              <AlertTriangle size={34} />
            </div>

            <h1 className="text-2xl font-extrabold text-azul">
              Ocurrió un error en NEXIS
            </h1>

            <p className="mt-3 text-sm leading-6 text-textoSuave">
              La aplicación encontró un problema inesperado. Puedes recargar la página para intentar continuar.
            </p>

            {this.state.mensaje && (
              <p className="mt-4 rounded-xl bg-azulSuave p-3 text-xs font-semibold text-textoSuave">
                {this.state.mensaje}
              </p>
            )}

            <button
              type="button"
              onClick={this.recargarPagina}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-azul px-5 py-3 text-sm font-bold text-white transition hover:bg-azul2"
            >
              <RefreshCw size={18} />
              Recargar aplicación
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
