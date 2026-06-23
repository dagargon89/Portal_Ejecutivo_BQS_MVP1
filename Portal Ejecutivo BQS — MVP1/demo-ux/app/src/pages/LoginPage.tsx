/* Login (RF-AUTH-01). Doble barrera credenciales + whitelist. En el demo la
 * contraseña no se valida; el correo se cruza contra AUTH_WHITELIST. Un correo
 * fuera de la lista (p. ej. intruso@competidor.com) -> /acceso-denegado (QA5).
 * Incluye accesos rápidos por persona para recorrer el sistema por rol. */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, ShieldCheck } from "lucide-react";
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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-base font-bold text-white">
            BQS
          </span>
          <h1 className="text-2xl font-bold text-slate-900">Portal Ejecutivo BQS</h1>
          <p className="text-sm text-slate-500">Acceso al portal financiero · by Dataholics</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
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
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                >
                  <span>
                    <span className="block text-sm font-medium text-slate-900">{p.nombre}</span>
                    <span className="block text-xs text-slate-500">{p.desc}</span>
                  </span>
                  <span className="text-xs text-slate-400">{p.correo}</span>
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
    </div>
  );
}
