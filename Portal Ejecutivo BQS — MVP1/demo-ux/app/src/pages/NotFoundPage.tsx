import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
      <p className="text-5xl font-bold text-primary">404</p>
      <p className="text-slate-600">La página que buscas no existe.</p>
      <Link to="/">
        <Button>Ir al resumen</Button>
      </Link>
    </div>
  );
}
