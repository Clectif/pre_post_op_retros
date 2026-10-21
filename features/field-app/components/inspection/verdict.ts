import type { Verdict } from "../../types";

/** Colores del veredicto, compartidos por la barra inferior y el resumen de cierre. */
export const VERDICT_STYLES: Record<Verdict | "none", string> = {
  none: "bg-subtle text-muted ring-1 ring-line ring-inset",
  apta: "bg-ok-soft text-ok-ink ring-1 ring-ok-line ring-inset",
  obs: "bg-warn-soft text-warn-ink ring-1 ring-warn-line ring-inset",
  noapta: "bg-bad-soft text-bad-ink ring-1 ring-bad-line ring-inset",
};
