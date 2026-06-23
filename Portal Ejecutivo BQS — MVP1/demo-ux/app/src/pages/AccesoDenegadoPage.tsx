/* Pantalla de acceso denegado (QA5 / RF-AUTH-01). Correo fuera de whitelist. */
import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function AccesoDenegadoPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft">
          <ShieldAlert className="h-7 w-7 text-danger" aria-hidden />
        </span>
        <h1 className="text-xl font-bold text-slate-900">Acceso denegado</h1>
        <p className="mt-2 text-sm text-slate-600">
          El correo no está autorizado para este portal financiero. Si crees que es un error,
          contacta al administrador para que te agregue a la lista de acceso.
        </p>
        <div className="mt-6">
          <Link to="/login">
            <Button variant="ghost">Volver a iniciar sesión</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
