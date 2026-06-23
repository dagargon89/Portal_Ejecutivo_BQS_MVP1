/* Login (RF-AUTH-01). Doble barrera credenciales + whitelist. En el demo la
 * contraseña no se valida; el correo se cruza contra AUTH_WHITELIST. Un correo
 * fuera de la lista (p. ej. intruso@competidor.com) -> /acceso-denegado (QA5).
 * Incluye accesos rápidos por persona para recorrer el sistema por rol.
 *
 * Layout en dos columnas: panel de marca + valor del sistema (izquierda,
 * visible en ≥lg) y formulario de acceso (derecha). Respeta los tokens de
 * marca del doc 08 (azul #0b4f9e, verde #0e9f6e). */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogIn,
  ShieldCheck,
  LineChart,
  Receipt,
  Lock,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useSession } from "@/auth/session";
import { api, ApiError } from "@/lib";

const PERSONAS = [
  { correo: "admin@dataholics.com.mx", nombre: "Admin Dataholics", desc: "Ve todo el sistema" },
  { correo: "facturacion@bestqualitysolutions.com", nombre: "Cobranza BQS", desc: "Facturación y pagos" },
  { correo: "captura@bestqualitysolutions.com", nombre: "Lourdes Núñez", desc: "Captura de devengado" },
  { correo: "eric@bestqualitysolutions.com", nombre: "Eric — Dirección", desc: "Solo lectura" },
];

const FEATURES = [
  {
    icon: LineChart,
    titulo: "Las tres preguntas, al instante",
    desc: "Qué se facturó, qué falta por facturar y cuánto te deben — en un solo vistazo.",
  },
  {
    icon: Receipt,
    titulo: "Ciclo de cobro completo",
    desc: "Del devengado a la factura y al pago, con reglas y trazabilidad de extremo a extremo.",
  },
  {
    icon: ShieldCheck,
    titulo: "Seguridad por diseño",
    desc: "Whitelist de accesos y perfil de Dirección en estricta solo lectura.",
  },
];

export function LoginPage() {
  const { setUsuario } = useSession();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("admin@dataholics.com.mx");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function entrar(correoLogin: string) {
    setLoading(true);
    setError(null);
    try {
      const { usuario } = await api.login({ correo: correoLogin, password });
      setUsuario(usuario);
      navigate("/", { replace: true });
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        navigate("/acceso-denegado", { replace: true });
        return;
      }
      setError(e instanceof Error ? e.message : "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* ================= IZQUIERDA · marca + valor del sistema ================= */}
      <aside className="relative hidden overflow-hidden bg-primary p-12 text-white lg:flex lg:flex-col lg:justify-between">
        {/* Fondo: degradado de marca + halos decorativos */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-primary via-[#0a4a93] to-[#072a52]"
        />
        <div
          aria-hidden
          className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-secondary/25 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-primary-hover/40 blur-3xl"
        />

        {/* Marca */}
        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-base font-bold tracking-tight ring-1 ring-white/25 backdrop-blur">
            BQS
          </span>
          <div className="leading-tight">
            <p className="text-base font-semibold">Portal Ejecutivo BQS</p>
            <p className="text-sm text-white/70">by Dataholics</p>
          </div>
        </div>

        {/* Mensaje central + features — contenedor centrado, texto a la izquierda */}
        <div className="relative mx-auto max-w-md">
          <h2 className="text-3xl font-bold leading-tight tracking-tight">
            Tu información financiera, consolidada y bajo control.
          </h2>
          <p className="mt-3 text-base text-white/75">
            El portal de lectura de la Dirección General: del dato disperso a una
            sola fuente de verdad.
          </p>

          <ul className="mt-9 flex flex-col gap-5">
            {FEATURES.map(({ icon: Icon, titulo, desc }) => (
              <li key={titulo} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                  <Icon className="h-5 w-5 text-white" aria-hidden />
                </span>
                <div>
                  <p className="font-semibold">{titulo}</p>
                  <p className="text-sm text-white/70">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Pie: solo-lectura + datos simulados */}
        <div className="relative flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/70">
          <span className="inline-flex items-center gap-1.5">
            <Lock className="h-4 w-4" aria-hidden />
            Dirección en solo lectura
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Database className="h-4 w-4" aria-hidden />
            Demo · datos simulados
          </span>
        </div>
      </aside>

      {/* ================= DERECHA · formulario de acceso ================= */}
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-md">
          {/* Encabezado de marca (solo móvil/tablet: el panel izq. está oculto) */}
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-base font-bold text-white">
              BQS
            </span>
            <p className="text-lg font-bold text-slate-900">Portal Ejecutivo BQS</p>
            <p className="text-sm text-slate-500">Acceso al portal financiero · by Dataholics</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Iniciar sesión</h1>
              <p className="mt-1 text-sm text-slate-500">
                Ingresa con tu correo autorizado para continuar.
              </p>
            </div>

            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                void entrar(correo);
              }}
            >
              <TextField
                label="Correo"
                type="email"
                autoComplete="username"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
              />
              <TextField
                label="Contraseña"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                hint="En el demo la contraseña no se valida."
              />
              {error ? (
                <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
                  {error}
                </p>
              ) : null}
              <Button type="submit" loading={loading} icon={<LogIn className="h-4 w-4" aria-hidden />}>
                Iniciar sesión
              </Button>
            </form>

            <div className="mt-6 border-t border-slate-200 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Acceso rápido por rol
              </p>
              <div className="grid grid-cols-1 gap-2">
                {PERSONAS.map((p) => (
                  <button
                    key={p.correo}
                    onClick={() => {
                      setCorreo(p.correo);
                      void entrar(p.correo);
                    }}
                    disabled={loading}
                    className="group flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-left transition-colors hover:border-primary/30 hover:bg-primary-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                  >
                    <span>
                      <span className="block text-sm font-medium text-slate-900">{p.nombre}</span>
                      <span className="block text-xs text-slate-500">{p.desc}</span>
                    </span>
                    <span className="hidden text-xs text-slate-400 group-hover:text-primary sm:block">
                      {p.correo}
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-3 flex items-center gap-1 text-xs text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                Prueba <code className="font-mono">intruso@competidor.com</code> para ver el bloqueo (QA5).
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
