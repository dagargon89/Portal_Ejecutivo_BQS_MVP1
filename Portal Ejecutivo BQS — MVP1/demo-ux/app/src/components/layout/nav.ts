/* Configuración de navegación del panel. `roles` = quién VE el ítem.
 * La escritura siempre la revalida el backend (el cliente solo oculta). */
import {
  LayoutDashboard,
  CircleDashed,
  Wallet,
  Users,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  ScrollText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Rol } from "@/lib";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles: Rol[]; // visibilidad
  end?: boolean;
}

export interface NavGroup {
  titulo: string;
  items: NavItem[];
}

const TODOS: Rol[] = ["direccion", "capturista", "facturacion", "admin"];

export const navGroups: NavGroup[] = [
  {
    titulo: "Dirección",
    items: [
      { to: "/", label: "Resumen", icon: LayoutDashboard, roles: TODOS, end: true },
      { to: "/por-facturar", label: "Por facturar", icon: CircleDashed, roles: TODOS },
      { to: "/por-cobrar", label: "Por cobrar", icon: Wallet, roles: TODOS },
    ],
  },
  {
    titulo: "Operación",
    items: [
      { to: "/clientes", label: "Clientes", icon: Users, roles: TODOS },
      { to: "/cotizaciones", label: "Cotizaciones", icon: FileSpreadsheet, roles: TODOS },
      { to: "/facturas", label: "Facturas", icon: FileText, roles: TODOS },
    ],
  },
  {
    titulo: "Administración",
    items: [
      { to: "/admin/whitelist", label: "Whitelist", icon: ShieldCheck, roles: ["admin"] },
      { to: "/admin/auditoria", label: "Auditoría", icon: ScrollText, roles: ["admin"] },
    ],
  },
];
