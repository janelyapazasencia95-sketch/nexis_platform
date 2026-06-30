import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  ShieldCheck,
  User,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import imagenVicuna from "../assets/login-vicuna.png";
import logoNexis from "../assets/nexis-logo.png";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [recordar, setRecordar] = useState(false);
  const [error, setError] = useState("");
  const [mensajeRecuperacion, setMensajeRecuperacion] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    setRecordar(localStorage.getItem("nexis_recordar") === "true");
  }, []);

  const iniciarSesion = async (e) => {
  e.preventDefault();

  try {
    setCargando(true);
    setError("");
    setMensajeRecuperacion("");

    const usuarioLimpio = username.trim();
    const passwordLimpio = password.trim();

    await login(usuarioLimpio, passwordLimpio, recordar);

    navigate("/", { replace: true });
  } catch (error) {
    console.error("Error login:", error.response?.data || error.message);

    const mensaje =
      error.response?.data?.error ||
      error.response?.data?.detail ||
      "Usuario o contraseña incorrectos.";

    setError(mensaje);
  } finally {
    setCargando(false);
  }
};

  return (
    <main className="grid min-h-screen grid-cols-1 bg-fondo lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-azul lg:block">
        <img
          src={imagenVicuna}
          alt="Vicuña en paisaje andino"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-br from-[#07226B]/85 via-[#253A82]/60 to-[#291575]/75" />

        <div className="relative z-10 flex h-full flex-col justify-between p-14 text-white">
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg">
  <img
    src={logoNexis}
    alt="Logo NEXIS"
    className="h-12 w-12 object-contain"
  />
</div>

              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">
                  NEXIS
                </h1>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/80">
                  Vicuña Fiber Management
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-xl">
            <h2 className="text-5xl font-extrabold leading-tight">
              Plataforma de gestión de fibra de vicuña
            </h2>

            <p className="mt-5 text-lg leading-8 text-white/85">
              Control operativo, financiero y regional para la trazabilidad de
              compras, proveedores, pagos e inventario.
            </p>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
             <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
  <img
    src={logoNexis}
    alt="Logo NEXIS"
    className="h-12 w-12 object-contain"
  />
</div>

            <h1 className="text-4xl font-extrabold text-azul">NEXIS</h1>
            <p className="mt-1 text-sm font-semibold uppercase tracking-[0.2em] text-textoSuave">
              Vicuña Fiber Management
            </p>
          </div>

          <div className="rounded-2xl border border-borde bg-white p-8 shadow-sm">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-azulClaro text-azul">
                <Lock size={32} />
              </div>

              <h2 className="text-3xl font-extrabold text-azul">
                Iniciar sesión
              </h2>

              <p className="mt-2 text-sm text-textoSuave">
                Accede al panel administrativo.
              </p>
            </div>

            {error && (
              <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-rojoClaro p-4 text-rojo">
                <AlertTriangle size={20} />
                <p className="text-sm font-semibold">{error}</p>
              </div>
            )}

            {mensajeRecuperacion && (
              <div className="mb-5 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-[#0B5A82]">
                <ShieldCheck size={20} />
                <p className="text-sm font-semibold">{mensajeRecuperacion}</p>
              </div>
            )}

            <form onSubmit={iniciarSesion} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-texto">
                  Usuario
                </label>

                <div className="relative">
                  <User
                    className="absolute left-4 top-3.5 text-gris"
                    size={20}
                  />

                  <input
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    className="w-full rounded-xl border border-borde bg-azulSuave py-3 pl-12 pr-4 outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-texto">
                  Contraseña
                </label>

                <div className="relative">
                  <Lock
                    className="absolute left-4 top-3.5 text-gris"
                    size={20}
                  />

                  <input
                    required
                    type={mostrarPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-borde bg-azulSuave py-3 pl-12 pr-12 outline-none focus:border-azul2 focus:ring-2 focus:ring-azulClaro"
                  />

                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    className="absolute right-4 top-3.5 text-gris hover:text-azul"
                  >
                    {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-textoSuave">
                  <input
                    type="checkbox"
                    checked={recordar}
                    onChange={(e) => setRecordar(e.target.checked)}
                    className="h-4 w-4 rounded border-borde text-azul focus:ring-azul"
                  />
                  Recordarme
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setMensajeRecuperacion(
                      "Para recuperar tu acceso, contacta al administrador del sistema NEXIS."
                    );
                  }}
                  className="text-sm font-bold text-azul hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-azul px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-azul2 disabled:opacity-60"
              >
                <LogIn size={20} />
                {cargando ? "Ingresando..." : "Ingresar"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Login;