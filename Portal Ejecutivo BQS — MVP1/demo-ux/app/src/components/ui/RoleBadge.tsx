/* Chip de rol (SRS §2.2). Color informativo + texto (nunca solo color). */
import type { Rol } from "@/lib";

const label: Record<Rol, string> = {
  direccion: "Dirección",
  capturista: "Capturista",
  facturacion: "Facturación",
  admin: "Administrador",
};

export function RoleBadge({ rol }: { rol: Rol }) {
  return (
    <span className="inline-flex items-center rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary">
      {label[rol]}
    </span>
  );
}
