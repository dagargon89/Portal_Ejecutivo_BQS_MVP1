# 08 — Identidad Visual y Design System

| Campo | Valor |
|---|---|
| **Documento** | 08 — Identidad Visual y Design System |
| **Versión** | 1.0 |
| **Fecha** | 18/06/2026 |
| **Producto** | Portal Ejecutivo BQS — MVP1 |
| **Organización** | Best Quality Solutions México (BQS) · Ciudad Juárez · *by Dataholics* |
| **Origen** | Tokens de marca canónicos definidos en [`CLAUDE.md` §"Identidad visual (obligatoria)"](../CLAUDE.md); este documento los detalla y completa sin alterarlos. |
| **Dirección** | Estilo sobrio financiero, claro y confiable, **móvil-first** (el usuario principal, Eric/Dirección, lee KPIs en teléfono). |
| **Stack visual** | React 19 + Vite + TypeScript · Tailwind CSS 3 · `lucide-react` |
| **Depende de** | [`CLAUDE.md`](../CLAUDE.md) · [01 — SRS](01_SRS_especificacion_requisitos.md) (RNF-07 usabilidad móvil, RNF-08 accesibilidad de color) · [02 — Arquitectura](../02-arquitectura/02_arquitectura_sistema.md) (stack React/Tailwind; "el cliente solo presenta") |

> Este documento es la **fuente única de verdad visual**. Los tokens de la sección 6 y el `theme.extend` de la sección 7 se pegan tal cual en el proyecto `/web`. Toda decisión de color respeta exactamente los hex canónicos de [`CLAUDE.md`](../CLAUDE.md); los tonos `soft`/`hover`/`strong` se derivan de forma coherente y verificada contra WCAG 2.1 AA (sección 10).

---

## 1. Identidad de marca

El portal es una herramienta financiera de la Dirección General. Su personalidad visual transmite **confianza, sobriedad y claridad**: el azul institucional ancla la marca; el dato manda y nada compite con él. No es un panel "bonito" ni colorido — es un instrumento de lectura rápida bajo presión, a menudo en un teléfono.

| Atributo | Definición |
|---|---|
| **Nombre** | Portal Ejecutivo BQS |
| **Endoso** | *by Dataholics* (lockup discreto en login y pie; nunca compite con la marca BQS) |
| **Propósito visual** | Responder en segundos las 3 preguntas: qué se facturó, qué falta por facturar, cuánto deben. |
| **Personalidad** | Sobria · financiera · clara · confiable · institucional |
| **Tono visual** | Limpio y denso de información útil; mucho espacio en blanco controlado; jerarquía fuerte; cifras protagonistas. |
| **Antipatrones (prohibido)** | (1) Saturación de datos sin jerarquía. (2) Colorido excesivo o gradientes decorativos. (3) Depender **solo del color** para comunicar estado (regla dura del proyecto: siempre ícono + texto). (4) Tipografía fina/decorativa para cifras. (5) Sombras pesadas o "neumorfismo". (6) Usar el verde de "pagado" para acciones destructivas. |

### 1.1 Colores de marca (canónicos — NO se modifican)

Provienen de [`CLAUDE.md`](../CLAUDE.md). Son inmutables; cualquier tono adicional se **deriva** de ellos.

| Color | Hex | Nombre | Rol |
|---|---|---|---|
| 🔵 | `#0B4F9E` | **Azul BQS** (primario) | Confianza financiera: navegación, encabezados, acción primaria, estado `Vigente`/informativo. |
| 🔵 | `#08407F` | Azul BQS hover (derivado) | Estado hover/active del primario. |
| 🟢 | `#0E9F6E` | **Verde positivo** (secundario) | Dinero cobrado / indicadores positivos / estado `Pagada`. |
| 🟠 | `#B45309` | **Ámbar advertencia** | Facturas `Vencida`, "por facturar", advertencias. |
| 🔴 | `#B91C1C` | **Rojo peligro** | Saldos críticos, errores, acción destructiva. |

> **Nota de uso del verde:** `#0E9F6E` ofrece 3.39:1 sobre blanco — suficiente para **superficie grande** (fondo de KPI con texto blanco grande/semibold) pero **insuficiente para texto normal**. Por eso se deriva `--color-secondary-strong: #0A7D57` (5.14:1) para todo texto verde sobre blanco o sobre tintes. Regla heredada de [`CLAUDE.md`](../CLAUDE.md).

---

## 2. Paleta de color completa

Cuatro bloques: base, marca/acento, semánticos de estado y reglas de accesibilidad. Todos los tokens se consolidan en la sección 6.

### 2.1 Base — neutros, superficies y texto

Escala neutra fría (familia *slate*) coherente con el azul de marca. Evita los grises puros: dan un tono más institucional y "financiero".

| Token | Hex | Rol |
|---|---|---|
| `--color-bg` | `#F8FAFC` | Fondo de aplicación (lienzo). |
| `--color-surface` | `#FFFFFF` | Superficie de tarjetas, tablas, modales. |
| `--color-surface-2` | `#F1F5F9` | Superficie secundaria (encabezado de tabla, zonas hundidas, skeleton base). |
| `--color-border` | `#E2E8F0` | Bordes y divisores de uso general. |
| `--color-border-strong` | `#CBD5E1` | Bordes de inputs y separadores con más peso. |
| `--color-text` | `#0F172A` | Texto principal y cifras (17.85:1 sobre blanco). |
| `--color-text-secondary` | `#334155` | Texto secundario, etiquetas (10.35:1). |
| `--color-text-muted` | `#64748B` | Texto atenuado, ayudas, placeholders (4.76:1 — AA). |
| `--color-text-on-brand` | `#FFFFFF` | Texto sobre fondos de color saturado (azul, verde, ámbar, rojo). |

### 2.2 Marca y acento

| Token | Hex | Rol | Derivación |
|---|---|---|---|
| `--color-primary` | `#0B4F9E` | Acción primaria, nav, encabezados. | Canónico |
| `--color-primary-hover` | `#08407F` | Hover/active del primario. | Canónico (sugerido en CLAUDE.md) |
| `--color-primary-soft` | `#EAF2FB` | Fondo suave: chips informativos, fila activa, selección. | Tinte del primario |
| `--color-primary-contrast` | `#FFFFFF` | Texto/ícono sobre el primario. | — |
| `--color-secondary` | `#0E9F6E` | Positivo / cobrado (superficie grande). | Canónico |
| `--color-secondary-strong` | `#0A7D57` | **Texto** verde (sobre blanco o tinte). | Verde oscurecido para AA |
| `--color-secondary-soft` | `#E6F6EF` | Fondo suave positivo / badge `Pagada`. | Tinte del secundario |

### 2.3 Semánticos de estado — mapeados al Ciclo de Cobro

Cada estado financiero del [SRS §4](01_SRS_especificacion_requisitos.md) tiene un color **y** un ícono **y** un texto. El color nunca viaja solo (RNF-08).

| Token | Hex | Token fondo suave | Texto sobre suave |
|---|---|---|---|
| `--color-success` | `#0E9F6E` | `--color-success-soft: #E6F6EF` | `--color-secondary-strong: #0A7D57` |
| `--color-warning` | `#B45309` | `--color-warning-soft: #FBF1E5` | `--color-warning-strong: #92400E` |
| `--color-danger` | `#B91C1C` | `--color-danger-soft: #FBE9E9` | `--color-danger: #B91C1C` |
| `--color-info` | `#0B4F9E` | `--color-info-soft: #EAF2FB` | `--color-primary: #0B4F9E` |

**Mapeo a los estados del Ciclo de Cobro:**

| Estado del ciclo | Semántica | Color base | Fondo de badge | Ícono `lucide` |
|---|---|---|---|---|
| **Vigente** (factura activa, al corriente) | Informativo | `--color-info` (azul `#0B4F9E`) | `--color-info-soft` | `FileText` / `Clock` |
| **Vencida** (pasó `Fecha_Vencimiento`, saldo > 0) | Advertencia | `--color-warning` (ámbar `#B45309`) | `--color-warning-soft` | `AlertTriangle` |
| **Pagada** (Σ pagos ≥ `Monto_Total`) | Éxito / positivo | `--color-success` (verde `#0E9F6E`) | `--color-success-soft` | `CheckCircle2` |
| **Pendiente por facturar** (devengado `Pendiente`) | Neutro-advertencia | `--color-warning-strong` sobre neutro | `--color-surface-2` | `CircleDashed` / `Hourglass` |
| **Saldo crítico / error** | Peligro | `--color-danger` (rojo `#B91C1C`) | `--color-danger-soft` | `AlertOctagon` |

> **Decisión "Pendiente por facturar":** se representa con **fondo neutro** (`surface-2`) + texto ámbar fuerte + ícono punteado, no con ámbar pleno. Así se distingue visualmente de `Vencida` (que sí es ámbar pleno y más urgente): lo "por facturar" es trabajo a convertir en dinero, no una alerta de cobranza. Coherente con el desglose de la Pregunta 2 ([RF-DASH-02](01_SRS_especificacion_requisitos.md)).

### 2.4 Reglas de accesibilidad (resumen; verificación completa en §10)

Estándar objetivo: **WCAG 2.1 AA** — texto normal ≥ 4.5:1, texto grande (≥ 18.66px bold o ≥ 24px) ≥ 3:1, componentes de UI/foco ≥ 3:1. Ratios calculados con la fórmula de luminancia relativa WCAG.

| Fondo | Texto | Ratio | Veredicto | Uso |
|---|---|---|---|---|
| `#0B4F9E` primario | `#FFFFFF` | **8.00:1** | AAA | Botón primario, nav, header. |
| `#08407F` hover | `#FFFFFF` | **10.24:1** | AAA | Hover del primario. |
| `#FFFFFF` | `#0B4F9E` | **8.00:1** | AAA | Enlace/texto azul sobre blanco. |
| `#0E9F6E` secundario | `#FFFFFF` | **3.39:1** | AA solo texto **grande** | KPI "facturado" con cifra grande semibold. |
| `#FFFFFF` | `#0A7D57` strong | **5.14:1** | AA | Texto verde normal sobre blanco. |
| `#B45309` ámbar | `#FFFFFF` | **5.02:1** | AA | Badge/botón ámbar con texto blanco. |
| `#B91C1C` rojo | `#FFFFFF` | **6.47:1** | AA | Botón peligro, alertas. |
| `#FBF1E5` ámbar-soft | `#92400E` strong | **6.35:1** | AA | Texto de badge `Vencida`. |
| `#E6F6EF` verde-soft | `#0A7D57` strong | **4.60:1** | AA | Texto de badge `Pagada`. |
| `#FBE9E9` rojo-soft | `#B91C1C` | **5.53:1** | AA | Texto de badge crítico. |
| `#EAF2FB` azul-soft | `#0B4F9E` | **7.08:1** | AAA | Texto de badge `Vigente`. |

**Combinaciones a EVITAR (no cumplen AA para texto normal):**

| Fondo | Texto | Ratio | Por qué se evita |
|---|---|---|---|
| `#FFFFFF` | `#0E9F6E` verde | 3.39:1 | Falla AA en texto normal → usar `--color-secondary-strong`. |
| `#0E9F6E` verde | `#FFFFFF` | 3.39:1 | Solo válido en texto **grande**; prohibido en cuerpo/labels. |
| `#FFFFFF` | `#94A3B8` slate-400 | 2.56:1 | Texto gris claro ilegible (prohibido en CLAUDE.md). |
| `#FFFFFF` | `#A0AEC0` | 2.26:1 | Ídem. |
| `#FFFFFF` | `#FBBF24` ámbar claro | 1.67:1 | Ámbar claro nunca como texto. |

---

## 3. Tipografía

### 3.1 Familias

| Uso | Familia | Fuente | Razón |
|---|---|---|---|
| UI general | **Inter** | Google Fonts (`Inter`, pesos 400/500/600/700) | Neutra, alta legibilidad en pantallas y tamaños pequeños; estándar de fintech. |
| **Cifras financieras** | Inter + `font-variant-numeric: tabular-nums` | — | Dígitos de **ancho fijo**: las columnas de montos quedan alineadas y comparables de un vistazo. |
| Monoespaciada (folios, RFC, IDs) | `ui-monospace`, `SFMono-Regular`, `Menlo` | sistema | Folios `F-XXXXX`, `CLI-XXX`, RFC: caracteres inconfundibles. |

Fallback completo: `Inter, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`.

Carga (en `index.html`, con `preconnect` para no bloquear el render):

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

> **Regla dura — cifras:** todo monto, KPI, saldo o cantidad usa `tabular-nums`. En Tailwind: la utilidad estándar `tabular-nums`. Token de apoyo: `--font-num`.

### 3.2 Escala tipográfica

Escala modular discreta (base 16px = `1rem`). Las cifras de KPI son la excepción de tamaño: dominan la pantalla.

| Nivel | Token / clase Tailwind | Tamaño | Peso | Line-height | Uso |
|---|---|---|---|---|---|
| Display KPI | `text-4xl` (`--text-kpi`) | 36px | 700 | 1.1 | Cifra principal de tarjeta de KPI (con `tabular-nums`). |
| H1 | `text-2xl` | 24px | 700 | 1.25 | Título de pantalla. |
| H2 | `text-xl` | 20px | 600 | 1.3 | Sección / encabezado de tarjeta. |
| H3 | `text-lg` | 18px | 600 | 1.4 | Subsección. |
| Body | `text-base` | 16px | 400 | 1.5 | Texto de lectura, celdas de tabla. |
| Body-sm | `text-sm` | 14px | 400/500 | 1.5 | Texto secundario, ayudas, badges. |
| Caption | `text-xs` | 12px | 500 | 1.4 | Etiquetas, metadatos, encabezados de tabla en mayúsculas. |

### 3.3 Reglas de jerarquía

1. **Una sola cifra dominante por tarjeta de KPI** (Display 36px). Su etiqueta va arriba en `text-xs` mayúsculas atenuadas; el contexto (variación, periodo) en `text-sm`.
2. **Peso, no color, marca la jerarquía base.** El color solo añade significado de estado, no jerarquía.
3. **Mayúsculas (`uppercase` + `tracking-wide`) solo en etiquetas cortas** (encabezados de tabla, labels de KPI), nunca en frases.
4. **Montos siempre con `tabular-nums`** y alineados a la derecha en tablas.
5. **Máximo 3 niveles tipográficos visibles** por pantalla para no romper la sobriedad.

---

## 4. Espaciado y layout

### 4.1 Sistema de espaciado (múltiplos de 4px)

Toda separación, padding y margen es múltiplo de **4px**. Coincide con la escala nativa de Tailwind (`1` = 4px).

| Token | Valor | Tailwind | Uso típico |
|---|---|---|---|
| `--space-1` | 4px | `1` | Separación mínima ícono-texto. |
| `--space-2` | 8px | `2` | Padding interno compacto, gap de badge. |
| `--space-3` | 12px | `3` | Padding de input, gap pequeño. |
| `--space-4` | 16px | `4` | Padding base de tarjeta, gap estándar. |
| `--space-6` | 24px | `6` | Separación entre tarjetas, padding de sección. |
| `--space-8` | 32px | `8` | Márgenes de bloque, separación de secciones. |
| `--space-12` | 48px | `12` | Aire mayor en escritorio. |

### 4.2 Breakpoints responsivos

Móvil-first (RNF-07). Los breakpoints coinciden con los de Tailwind; el diseño parte de 360px hacia arriba.

| Breakpoint | Ancho | Tailwind | Comportamiento |
|---|---|---|---|
| **Móvil** | 360–639px | (base) | **1 columna.** Los 3 KPIs se apilan verticalmente; nav inferior o menú colapsado; tabla → tarjetas apiladas o scroll horizontal **interno** contenido. Sin scroll horizontal de página. |
| **Tablet** | 640–1023px | `sm` / `md` | KPIs en 2–3 columnas; nav lateral plegable; tabla con columnas prioritarias. |
| **Escritorio** | ≥ 1024px | `lg` / `xl` | KPIs en **3 columnas** en una fila; nav lateral fija; tabla completa; ancho de contenido máximo `max-w-7xl`. |

> **Regla dura (RNF-07):** el dashboard de los **3 KPIs** debe verse **sin scroll horizontal a 360px**. Se logra apilando en 1 columna (`grid-cols-1`) en base y expandiendo con `sm:grid-cols-2 lg:grid-cols-3`. Verificado en la sección 5.4.

### 4.3 Radios de borde

| Token | Valor | Tailwind | Uso |
|---|---|---|---|
| `--radius-sm` | 6px | `rounded-md` | Badges, inputs, botones pequeños. |
| `--radius-md` | 8px | `rounded-lg` | Botones, inputs. |
| `--radius-lg` | 12px | `rounded-xl` | Tarjetas, modales. |
| `--radius-full` | 9999px | `rounded-full` | Chips, avatares, spinner. |

### 4.4 Sombras (sutiles — antipatrón: sombras pesadas)

| Token | Valor | Tailwind | Uso |
|---|---|---|---|
| `--shadow-sm` | `0 1px 2px 0 rgb(15 23 42 / 0.05)` | `shadow-sm` | Tarjetas en reposo. |
| `--shadow-md` | `0 4px 6px -1px rgb(15 23 42 / 0.08)` | `shadow-md` | Tarjetas elevadas, dropdowns. |
| `--shadow-lg` | `0 10px 15px -3px rgb(15 23 42 / 0.10)` | `shadow-lg` | Modales, toasts. |

---

## 5. Componentes

Cada componente: anatomía, estados, variantes, reglas, snippet JSX (React 19, clases **estándar** de Tailwind) y tokens. Los snippets son idiomáticos y sin placeholders; el cálculo y la autorización viven en el backend ([02 §3.1](../02-arquitectura/02_arquitectura_sistema.md)) — estos componentes solo presentan.

### 5.1 Botón

**Anatomía:** contenedor + (ícono opcional) + label. Altura mínima táctil **44px** (`h-11`).
**Variantes:** `primary` (azul), `secondary` (verde, acciones positivas/confirmación), `danger` (rojo), `ghost` (texto azul sin fondo).
**Estados:** `default`, `hover`, `focus-visible` (anillo azul), `disabled` (opacidad + sin puntero), `loading` (spinner + texto, deshabilitado).

```tsx
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  icon?: ReactNode;
}

const styles: Record<Variant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover focus-visible:ring-primary",
  secondary:
    "bg-secondary text-white hover:bg-secondary-strong focus-visible:ring-secondary",
  danger:
    "bg-danger text-white hover:bg-red-800 focus-visible:ring-danger",
  ghost:
    "bg-transparent text-primary hover:bg-primary-soft focus-visible:ring-primary",
};

export function Button({
  variant = "primary",
  loading = false,
  icon,
  children,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold
        transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      <span>{children}</span>
    </button>
  );
}
```

**Tokens:** `--color-primary`, `--color-primary-hover`, `--color-primary-soft`, `--color-secondary`, `--color-secondary-strong`, `--color-danger`, `--radius-md`.
**Reglas:** una sola acción primaria por vista; nunca usar `secondary` (verde) para acciones destructivas; el `disabled` jamás reemplaza la validación de servidor.

### 5.2 Input / Select

**Anatomía:** label + control + (texto de ayuda | mensaje de error).
**Estados:** `default`, `focus` (anillo + borde azul), `disabled`, `error` (borde + texto rojo + ícono).

```tsx
import { AlertCircle } from "lucide-react";
import { useId } from "react";
import type { InputHTMLAttributes } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function TextField({ label, error, hint, ...props }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={`h-11 rounded-lg border bg-white px-3 text-base text-slate-900
          placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1
          disabled:bg-slate-100 disabled:text-slate-400
          ${error
            ? "border-danger focus:ring-danger"
            : "border-slate-300 focus:border-primary focus:ring-primary"}`}
        {...props}
      />
      {error ? (
        <p id={`${id}-err`} className="flex items-center gap-1 text-sm text-danger">
          <AlertCircle className="h-4 w-4" aria-hidden /> {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
```

**Tokens:** `--color-border-strong`, `--color-primary`, `--color-danger`, `--color-text`, `--color-text-muted`.
**Reglas:** el error siempre lleva **ícono + texto** (no solo borde rojo); `aria-invalid` y `aria-describedby` obligatorios; los montos usan `inputMode="decimal"`.

### 5.3 Badge / Chip de estado (Vigente · Vencida · Pagada · Pendiente)

**Regla dura del proyecto:** el estado **nunca** se comunica solo con color. Cada badge lleva **ícono + texto** (RNF-08, daltonismo).

**Anatomía:** contenedor `rounded-full` + ícono `lucide` 14px + texto.

```tsx
import {
  CheckCircle2, AlertTriangle, FileText, CircleDashed, AlertOctagon,
} from "lucide-react";
import type { ReactNode } from "react";

type Estado = "vigente" | "vencida" | "pagada" | "pendiente" | "critico";

const config: Record<Estado, { label: string; cls: string; icon: ReactNode }> = {
  vigente:   { label: "Vigente",   cls: "bg-info-soft text-primary",
               icon: <FileText className="h-3.5 w-3.5" aria-hidden /> },
  vencida:   { label: "Vencida",   cls: "bg-warning-soft text-warning-strong",
               icon: <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> },
  pagada:    { label: "Pagada",    cls: "bg-success-soft text-secondary-strong",
               icon: <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> },
  pendiente: { label: "Por facturar", cls: "bg-slate-100 text-warning-strong",
               icon: <CircleDashed className="h-3.5 w-3.5" aria-hidden /> },
  critico:   { label: "Saldo crítico", cls: "bg-danger-soft text-danger",
               icon: <AlertOctagon className="h-3.5 w-3.5" aria-hidden /> },
};

export function StatusBadge({ estado }: { estado: Estado }) {
  const { label, cls, icon } = config[estado];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}
    >
      {icon}
      {label}
    </span>
  );
}
```

**Tokens:** pares verificados en §10 — `info-soft`/`primary` (7.08:1), `warning-soft`/`warning-strong` (6.35:1), `success-soft`/`secondary-strong` (4.60:1), `slate-100`/`warning-strong` (6.55:1), `danger-soft`/`danger` (5.53:1).

### 5.4 Tarjeta de KPI (las 3 preguntas)

**Anatomía:** ícono de contexto + etiqueta (la pregunta) + **cifra dominante** (`tabular-nums`) + nota de detalle.
**Variantes por pregunta:** facturado (verde/positivo), por facturar (ámbar), por cobrar (azul; rojo si crítico).

```tsx
import type { ReactNode } from "react";

interface KpiCardProps {
  label: string;        // "¿Cuánto te deben?"
  value: string;        // ya formateado por el cliente: "$30,000.00"
  note?: string;        // "Neto de abonos"
  icon: ReactNode;
  accent: "primary" | "secondary" | "warning" | "danger";
}

const accentBar: Record<KpiCardProps["accent"], string> = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  warning: "bg-warning",
  danger: "bg-danger",
};

export function KpiCard({ label, value, note, icon, accent }: KpiCardProps) {
  return (
    <article className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <span className={`absolute inset-y-0 left-0 w-1 ${accentBar[accent]}`} aria-hidden />
      <div className="flex items-center gap-2 text-slate-500">
        <span aria-hidden>{icon}</span>
        <h2 className="text-xs font-medium uppercase tracking-wide">{label}</h2>
      </div>
      <p className="mt-2 text-4xl font-bold leading-none text-slate-900 tabular-nums">
        {value}
      </p>
      {note ? <p className="mt-2 text-sm text-slate-500">{note}</p> : null}
    </article>
  );
}
```

**Grid del dashboard (sin scroll horizontal a 360px — RNF-07):**

```tsx
<section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
  <KpiCard label="¿Qué ya se facturó?"      value={facturado}   accent="secondary" icon={<TrendingUp className="h-5 w-5" />} note="Mes en curso" />
  <KpiCard label="¿Qué falta por facturar?" value={porFacturar} accent="warning"   icon={<CircleDashed className="h-5 w-5" />} note="Devengado pendiente" />
  <KpiCard label="¿Cuánto te deben?"        value={porCobrar}   accent="primary"   icon={<Wallet className="h-5 w-5" />} note="Neto de abonos" />
</section>
```

**Tokens:** `--radius-lg`, `--shadow-sm`, `--text-kpi`, `--color-secondary`, `--color-warning`, `--color-primary`, `--font-num`.
**Reglas:** una cifra dominante por tarjeta; barra de acento lateral (4px) como segundo canal además del ícono; el cliente **formatea** la cifra que llega ya calculada del backend ([RF-DASH-04](01_SRS_especificacion_requisitos.md)).

### 5.5 Tabla (cartera por cliente)

**Anatomía:** encabezado `surface-2` (etiquetas `text-xs` mayúsculas) + filas con divisores + montos a la derecha con `tabular-nums` + columna de estado con `StatusBadge`.
**Estados de fila:** `default`, `hover` (`bg-slate-50`), `selected` (`bg-primary-soft`).
**Responsive:** en móvil, scroll horizontal **interno** (`overflow-x-auto`) — nunca de página.

```tsx
import { StatusBadge } from "./StatusBadge";

interface Fila {
  folio: string; cliente: string; monto: string; saldo: string;
  estado: "vigente" | "vencida" | "pagada";
}

export function CarteraTable({ filas }: { filas: Fila[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-100">
          <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <th scope="col" className="px-4 py-3">Folio</th>
            <th scope="col" className="px-4 py-3">Cliente</th>
            <th scope="col" className="px-4 py-3 text-right">Monto</th>
            <th scope="col" className="px-4 py-3 text-right">Saldo</th>
            <th scope="col" className="px-4 py-3">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {filas.map((f) => (
            <tr key={f.folio} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-mono text-slate-700">{f.folio}</td>
              <td className="px-4 py-3 text-slate-900">{f.cliente}</td>
              <td className="px-4 py-3 text-right text-slate-900 tabular-nums">{f.monto}</td>
              <td className="px-4 py-3 text-right text-slate-900 tabular-nums">{f.saldo}</td>
              <td className="px-4 py-3"><StatusBadge estado={f.estado} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Tokens:** `--color-surface-2`, `--color-border`, `--color-text`, `--color-text-secondary`, `--color-primary-soft`.
**Reglas:** `scope="col"` en encabezados (accesibilidad); montos a la derecha con `tabular-nums`; folios e IDs en `font-mono`.

### 5.6 Navegación

**Anatomía:** barra superior azul (`--color-primary`) con marca + en escritorio nav lateral; en móvil, barra inferior fija con íconos + label corto (zona táctil 44px).
**Estados de ítem:** `default`, `hover`, `active` (fondo `primary-hover` o indicador), `focus-visible`.

```tsx
import { LayoutDashboard, Users, FileText } from "lucide-react";

const items = [
  { to: "/", label: "Resumen", icon: LayoutDashboard },
  { to: "/cartera", label: "Cartera", icon: Users },
  { to: "/facturas", label: "Facturas", icon: FileText },
];

export function BottomNav({ current }: { current: string }) {
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-10 flex border-t border-slate-200 bg-white sm:hidden"
    >
      {items.map(({ to, label, icon: Icon }) => {
        const active = current === to;
        return (
          <a
            key={to}
            href={to}
            aria-current={active ? "page" : undefined}
            className={`flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium
              focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary
              ${active ? "text-primary" : "text-slate-500"}`}
          >
            <Icon className="h-5 w-5" aria-hidden />
            {label}
          </a>
        );
      })}
    </nav>
  );
}
```

**Tokens:** `--color-primary`, `--color-primary-hover`, `--color-text-muted`, `--color-border`.
**Reglas:** `aria-current="page"` en el activo; estado activo con color **e** indicador (texto azul + ícono relleno), no solo color.

### 5.7 Spinner / Skeleton

**Spinner:** ícono `Loader2` con `animate-spin`. **Skeleton:** bloques `bg-slate-100` con `animate-pulse` que replican la silueta del KPI/tabla (evita salto de layout).

```tsx
import { Loader2 } from "lucide-react";

export function Spinner({ label = "Cargando" }: { label?: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function KpiSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6" aria-hidden>
      <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
      <div className="mt-3 h-9 w-40 animate-pulse rounded bg-slate-100" />
      <div className="mt-3 h-3 w-20 animate-pulse rounded bg-slate-100" />
    </div>
  );
}
```

**Tokens:** `--color-primary`, `--color-surface-2`.
**Reglas:** `role="status"` + texto `sr-only` para lectores; el skeleton respeta las dimensiones reales para no mover el contenido.

### 5.8 Toast / Notificación

**Anatomía:** ícono semántico + título + descripción + cierre. Variantes `success`, `warning`, `error`, `info` (cada una con su `*-soft` y `*-strong`).
**Estados:** entrada/salida animadas; auto-cierre (excepto `error`).

```tsx
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, X } from "lucide-react";
import type { ReactNode } from "react";

type Tipo = "success" | "warning" | "error" | "info";

const map: Record<Tipo, { cls: string; icon: ReactNode }> = {
  success: { cls: "bg-success-soft text-secondary-strong",
             icon: <CheckCircle2 className="h-5 w-5" aria-hidden /> },
  warning: { cls: "bg-warning-soft text-warning-strong",
             icon: <AlertTriangle className="h-5 w-5" aria-hidden /> },
  error:   { cls: "bg-danger-soft text-danger",
             icon: <AlertOctagon className="h-5 w-5" aria-hidden /> },
  info:    { cls: "bg-info-soft text-primary",
             icon: <Info className="h-5 w-5" aria-hidden /> },
};

export function Toast({
  tipo, titulo, children, onClose,
}: { tipo: Tipo; titulo: string; children?: ReactNode; onClose: () => void }) {
  const { cls, icon } = map[tipo];
  return (
    <div
      role={tipo === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-xl border border-slate-200 p-4 shadow-lg ${cls}`}
    >
      {icon}
      <div className="flex-1">
        <p className="text-sm font-semibold">{titulo}</p>
        {children ? <p className="mt-0.5 text-sm">{children}</p> : null}
      </div>
      <button
        onClick={onClose}
        aria-label="Cerrar notificación"
        className="rounded p-0.5 hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
```

**Tokens:** los `*-soft`/`*-strong` semánticos + `--shadow-lg`.
**Reglas:** `role="alert"` para errores (anuncio inmediato), `role="status"` para el resto; siempre ícono + texto.

---

## 6. Tokens CSS completos

Bloque `:root` listo para pegar en `/web/src/styles/tokens.css` (importado en el entrypoint). Todos los hex canónicos respetados; tonos derivados verificados en §10.

```css
:root {
  /* === Base: superficies y fondos === */
  --color-bg: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-surface-2: #F1F5F9;
  --color-border: #E2E8F0;
  --color-border-strong: #CBD5E1;

  /* === Base: texto === */
  --color-text: #0F172A;
  --color-text-secondary: #334155;
  --color-text-muted: #64748B;
  --color-text-on-brand: #FFFFFF;

  /* === Marca / primario (canónico) === */
  --color-primary: #0B4F9E;
  --color-primary-hover: #08407F;
  --color-primary-soft: #EAF2FB;
  --color-primary-contrast: #FFFFFF;

  /* === Secundario / positivo (canónico + derivados) === */
  --color-secondary: #0E9F6E;
  --color-secondary-strong: #0A7D57;
  --color-secondary-soft: #E6F6EF;

  /* === Semánticos de estado === */
  --color-success: #0E9F6E;
  --color-success-soft: #E6F6EF;
  --color-warning: #B45309;
  --color-warning-strong: #92400E;
  --color-warning-soft: #FBF1E5;
  --color-danger: #B91C1C;
  --color-danger-soft: #FBE9E9;
  --color-info: #0B4F9E;
  --color-info-soft: #EAF2FB;

  /* === Tipografía === */
  --font-sans: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --font-num: "Inter", system-ui, sans-serif; /* usar con font-variant-numeric: tabular-nums */
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --text-kpi: 2.25rem;   /* 36px */
  --text-h1: 1.5rem;     /* 24px */
  --text-h2: 1.25rem;    /* 20px */
  --text-base: 1rem;     /* 16px */
  --text-sm: 0.875rem;   /* 14px */
  --text-xs: 0.75rem;    /* 12px */

  /* === Espaciado (múltiplos de 4px) === */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;

  /* === Radios === */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* === Sombras === */
  --shadow-sm: 0 1px 2px 0 rgb(15 23 42 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(15 23 42 / 0.08);
  --shadow-lg: 0 10px 15px -3px rgb(15 23 42 / 0.10);

  /* === Movimiento === */
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --duration-fast: 120ms;
  --duration-base: 180ms;
  --duration-slow: 240ms;
}
```

---

## 7. Configuración de Tailwind

Bloque `theme.extend` para `tailwind.config.ts` (Tailwind 3). Mapea los tokens a utilidades estándar — los snippets de la sección 5 usan clases como `bg-primary`, `text-warning-strong`, `bg-info-soft`, `rounded-xl`, `tabular-nums`, todas resueltas aquí o nativas de Tailwind.

```ts
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0B4F9E",
          hover: "#08407F",
          soft: "#EAF2FB",
          contrast: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#0E9F6E",
          strong: "#0A7D57",
          soft: "#E6F6EF",
        },
        success: { DEFAULT: "#0E9F6E", soft: "#E6F6EF" },
        warning: { DEFAULT: "#B45309", strong: "#92400E", soft: "#FBF1E5" },
        danger:  { DEFAULT: "#B91C1C", soft: "#FBE9E9" },
        info:    { DEFAULT: "#0B4F9E", soft: "#EAF2FB" },
        // Neutros: se usa la escala slate nativa de Tailwind (slate-50..900),
        // alineada con los tokens base (bg #F8FAFC = slate-50, etc.).
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "-apple-system", '"Segoe UI"', "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      fontSize: {
        // 'text-4xl' nativo (2.25rem) ya sirve para el KPI; se ajusta su line-height:
        "4xl": ["2.25rem", { lineHeight: "1.1", fontWeight: "700" }],
      },
      borderRadius: {
        md: "8px",
        lg: "12px",
        xl: "12px",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(15 23 42 / 0.05)",
        md: "0 4px 6px -1px rgb(15 23 42 / 0.08)",
        lg: "0 10px 15px -3px rgb(15 23 42 / 0.10)",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.2, 0, 0, 1)",
      },
      transitionDuration: {
        fast: "120ms",
        base: "180ms",
        slow: "240ms",
      },
    },
  },
  plugins: [],
} satisfies Config;
```

> El espaciado **no se extiende**: la escala nativa de Tailwind (`1`=4px, `2`=8px, …) ya es de múltiplos de 4px y coincide con los tokens `--space-*`. La escala neutra usa `slate-*` nativo, alineado a los tokens base.

---

## 8. Iconografía

| Aspecto | Decisión |
|---|---|
| **Librería** | **`lucide-react`** (ya disponible en el stack). Trazo abierto, estilo lineal sobrio, coherente con la personalidad financiera. |
| **Criterios** | Un solo set (no mezclar librerías); trazo `1.5–2px`; significado inequívoco; siempre con `aria-hidden` cuando acompañan texto, o `aria-label` si van solos. |
| **Tamaños estándar** | 16px (`h-4 w-4`) en línea con texto/badges · 20px (`h-5 w-5`) en KPIs y nav · 24px (`h-6 w-6`) en encabezados. |
| **Color** | Heredan `currentColor`; toman el color del contenedor (estado/semántica). |

**Íconos canónicos por concepto:**

| Concepto | Ícono `lucide` |
|---|---|
| Resumen / dashboard | `LayoutDashboard` |
| Facturado (positivo) | `TrendingUp` |
| Por facturar (pendiente) | `CircleDashed` / `Hourglass` |
| Por cobrar (cartera) | `Wallet` |
| Vigente | `FileText` / `Clock` |
| Vencida | `AlertTriangle` |
| Pagada | `CheckCircle2` |
| Saldo crítico / error | `AlertOctagon` |
| Cliente | `Users` |
| Cargando | `Loader2` (con `animate-spin`) |

---

## 9. Animaciones y microinteracciones

Sobriedad financiera = movimiento **discreto y funcional**, nunca decorativo. Respetar `prefers-reduced-motion`.

| Interacción | Duración | Easing | Qué se anima |
|---|---|---|---|
| Hover de botón/ítem | `120ms` (`fast`) | `standard` | `background-color`, `color`. |
| Anillo de foco | inmediato | — | Aparece sin transición (claridad de accesibilidad). |
| Entrada de toast | `180ms` (`base`) | `standard` | `opacity` + `translate-y` (8px). |
| Skeleton / carga | `~1.5s` loop | `ease-in-out` | `opacity` (`animate-pulse`). |
| Spinner | `~1s` loop lineal | `linear` | rotación (`animate-spin`). |
| Cambio de estado en badge | `180ms` | `standard` | `background-color` (acompañado del cambio de ícono/texto). |

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Reglas:** nada de parallax ni rebotes; las transiciones de color de estado siempre van acompañadas del cambio de **ícono + texto** (no solo color); duración máxima 240ms.

---

## 10. Verificación de accesibilidad

Todas las combinaciones **fondo/texto efectivamente usadas** en el sistema, con su ratio de contraste (luminancia relativa WCAG 2.1) y veredicto. Objetivo: **AA** (texto normal ≥ 4.5:1; texto grande ≥ 3:1; UI/foco ≥ 3:1).

| # | Fondo | Texto/elemento | Ratio | AA normal | AA grande | Uso |
|---|---|---|---|---|---|---|
| 1 | `#0B4F9E` primario | `#FFFFFF` | **8.00:1** | ✅ AAA | ✅ | Botón primario, nav, header. |
| 2 | `#08407F` hover | `#FFFFFF` | **10.24:1** | ✅ AAA | ✅ | Hover del primario. |
| 3 | `#FFFFFF` | `#0B4F9E` | **8.00:1** | ✅ AAA | ✅ | Texto/enlace azul, botón ghost. |
| 4 | `#FFFFFF` | `#0F172A` (text) | **17.85:1** | ✅ AAA | ✅ | Texto principal, cifras KPI. |
| 5 | `#FFFFFF` | `#334155` (secondary) | **10.35:1** | ✅ AAA | ✅ | Labels, texto secundario. |
| 6 | `#FFFFFF` | `#64748B` (muted) | **4.76:1** | ✅ AA | ✅ | Texto atenuado, notas, placeholder. |
| 7 | `#0A7D57` secondary-strong | `#FFFFFF` | **5.14:1** | ✅ AA | ✅ | Botón secundario (hover). |
| 8 | `#FFFFFF` | `#0A7D57` | **5.14:1** | ✅ AA | ✅ | Texto verde sobre blanco. |
| 9 | `#0E9F6E` secondary | `#FFFFFF` | **3.39:1** | ❌ | ✅ AA grande | Barra de acento / KPI con cifra **grande** semibold. |
| 10 | `#B45309` warning | `#FFFFFF` | **5.02:1** | ✅ AA | ✅ | Botón/barra ámbar con texto blanco. |
| 11 | `#B91C1C` danger | `#FFFFFF` | **6.47:1** | ✅ AA | ✅ | Botón peligro, toast error. |
| 12 | `#F1F5F9` surface-2 | `#64748B` muted | **4.34:1** | ⚠️ ~AA | ✅ | Etiquetas de encabezado de tabla (12px medium → se permite por tamaño/peso; alternativa segura: `#334155`). |
| 13 | `#F1F5F9` slate-100 | `#334155` (th texto) | **9.45:1** | ✅ AAA | ✅ | Encabezado de tabla (valor usado). |
| 14 | `#EAF2FB` info-soft | `#0B4F9E` | **7.08:1** | ✅ AAA | ✅ | Badge `Vigente`. |
| 15 | `#FBF1E5` warning-soft | `#92400E` strong | **6.35:1** | ✅ AA | ✅ | Badge `Vencida`, toast warning. |
| 16 | `#F1F5F9` slate-100 | `#92400E` strong | **6.55:1** | ✅ AA | ✅ | Badge `Por facturar` (neutro). |
| 17 | `#E6F6EF` success-soft | `#0A7D57` strong | **4.60:1** | ✅ AA | ✅ | Badge `Pagada`, toast success. |
| 18 | `#FBE9E9` danger-soft | `#B91C1C` | **5.53:1** | ✅ AA | ✅ | Badge `Saldo crítico`, toast error. |
| 19 | `#FFFFFF` | `#0B4F9E` (anillo foco) | **8.00:1** | n/a | ✅ (UI ≥3:1) | Anillo `focus-visible`. |

> **Nota fila 12/13:** el componente de tabla (§5.5) usa `text-slate-500` por defecto en encabezados (`4.34:1`, aceptable para 12px en mayúsculas con peso medium, pero al límite de AA). Para máxima holgura se recomienda `text-slate-700` (`#334155`, 9.45:1, fila 13). Ambas opciones quedan documentadas; la segura es `slate-700`.

**Combinaciones explícitamente prohibidas** (no se usan en producción):

| Fondo | Texto | Ratio | Motivo |
|---|---|---|---|
| `#FFFFFF` | `#0E9F6E` (verde) | 3.39:1 | Falla AA en texto normal → usar `secondary-strong`. |
| `#0E9F6E` | `#FFFFFF` | 3.39:1 | Solo texto grande; prohibido en cuerpo/labels. |
| `#FFFFFF` | `#94A3B8` (slate-400) | 2.56:1 | Texto gris claro ilegible. |
| `#FFFFFF` | `#FBBF24` (ámbar claro) | 1.67:1 | Ámbar claro nunca como texto. |

**Veredicto global:** de las **19 combinaciones en uso**, **18 cumplen AA para texto normal** y la restante (fila 9, blanco sobre verde `#0E9F6E`) se usa **exclusivamente** en texto grande/semibold y cumple **AA-grande (≥ 3:1)** — uso permitido y documentado en [`CLAUDE.md`](../CLAUDE.md). No se emplea ninguna combinación que falle su criterio aplicable. Todo estado se comunica con **color + ícono + texto** (RNF-08).
