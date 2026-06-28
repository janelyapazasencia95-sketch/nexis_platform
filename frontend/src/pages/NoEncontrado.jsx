import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft } from "lucide-react";

export default function NoEncontrado() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="max-w-lg w-full bg-white border border-[#B8D6E3] rounded-2xl shadow-sm p-8 text-center">
        <div className="mx-auto mb-5 h-16 w-16 rounded-full bg-[#EAF3F7] flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-[#0B5A82]" />
        </div>

        <h1 className="text-3xl font-bold text-[#21295C] mb-2">
          Página no encontrada
        </h1>

        <p className="text-[#374152] mb-6">
          La ruta que intentaste abrir no existe o fue movida dentro de NEXIS.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-[#0B5A82] px-5 py-3 text-white font-semibold hover:bg-[#1C7293] transition"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver al dashboard
        </Link>
      </div>
    </div>
  );
}
