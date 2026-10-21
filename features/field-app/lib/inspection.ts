import { MAX_HOURS_JUMP, SUSPICIOUS_DURATION_S } from "../config";
import { ITEMS } from "../data/inspection-items";
import { READINGS } from "../data/inspection-readings";
import { SECTIONS } from "../data/inspection-sections";
import type {
  Chasis,
  InspectionItem,
  InspectionState,
  Machine,
  ReadingDef,
  SectionDef,
  Verdict,
} from "../types";

export const VERDICT_TEXT: Record<Verdict, string> = {
  apta: "APTA",
  obs: "APTA C/ OBSERVACIONES",
  noapta: "NO APTA · BLOQUEADA",
};

export type SectionStatus = "done" | "fail" | "pend";

/** Ítems que aplican a esta fase, a este chasis y (si son semanales) a esta jornada. */
export const activeItems = (s: Pick<InspectionState, "fase" | "semanal">, chasis: Chasis): InspectionItem[] =>
  ITEMS.filter((i) => i.fase === s.fase && (!i.ch || i.ch === chasis) && (i.frec === "D" || s.semanal));

export const activeReadings = (fase: InspectionState["fase"], chasis: Chasis): ReadingDef[] =>
  READINGS.filter((l) => l.fase === fase && (!l.ch || l.ch === chasis));

function sectionStatus(
  secId: string,
  s: InspectionState,
  items: InspectionItem[],
  readings: ReadingDef[],
): SectionStatus {
  if (secId === "LEC") {
    return readings.filter((l) => l.req).every((l) => s.lect[l.k] != null) ? "done" : "pend";
  }
  const its = items.filter((i) => i.sec === secId);
  if (its.some((i) => s.resp[i.id]?.estado === "falla")) return "fail";
  return its.every((i) => s.resp[i.id]) ? "done" : "pend";
}

export interface InspectionView {
  items: InspectionItem[];
  readings: ReadingDef[];
  sections: SectionDef[];
  /** Sección realmente seleccionada (cae a la primera si la guardada ya no aplica). */
  currentSec: string;
  status: Record<string, SectionStatus>;
  /** Puntos (ítems + lecturas obligatorias) por sección: hechos / total. */
  counts: Record<string, { done: number; total: number }>;
  progress: { done: number; total: number };
  failures: InspectionItem[];
  verdict: Verdict | null;
}

/** Todo lo que la UI necesita saber del estado de la inspección, calculado en un solo lugar. */
export function deriveView(s: InspectionState, chasis: Chasis): InspectionView {
  const items = activeItems(s, chasis);
  const readings = activeReadings(s.fase, chasis);
  const requiredReadings = readings.filter((l) => l.req);

  const sections = SECTIONS.filter((sec) =>
    sec.id === "LEC"
      ? readings.length > 0
      : (sec.fase === "ambos" || sec.fase === s.fase) && items.some((i) => i.sec === sec.id),
  );

  const status: InspectionView["status"] = {};
  const counts: InspectionView["counts"] = {};
  for (const sec of sections) {
    status[sec.id] = sectionStatus(sec.id, s, items, readings);
    counts[sec.id] =
      sec.id === "LEC"
        ? { done: requiredReadings.filter((l) => s.lect[l.k] !== undefined).length, total: requiredReadings.length }
        : {
            done: items.filter((i) => i.sec === sec.id && s.resp[i.id]).length,
            total: items.filter((i) => i.sec === sec.id).length,
          };
  }

  const done =
    items.filter((i) => s.resp[i.id]).length + requiredReadings.filter((l) => s.lect[l.k] !== undefined).length;
  const total = items.length + requiredReadings.length;

  const failures = items.filter((i) => s.resp[i.id]?.estado === "falla");
  let verdict: Verdict | null = null;
  if (failures.some((i) => i.crit === "C")) verdict = "noapta";
  else if (failures.length) verdict = "obs";
  else if (done === total && total > 0) verdict = "apta";

  const currentSec = sections.some((x) => x.id === s.sec) ? s.sec : (sections[0]?.id ?? "");
  return { items, readings, sections, currentSec, status, counts, progress: { done, total }, failures, verdict };
}

/** Primera sección pendiente después de la actual, para avanzar sola al completar una. */
export function nextPendingSection(view: InspectionView): string | null {
  const ids = view.sections.map((x) => x.id);
  return ids.slice(ids.indexOf(view.currentSec) + 1).find((id) => view.status[id] === "pend") ?? null;
}

export function validateReading(
  l: ReadingDef,
  v: number | null,
  ctx: { machine: Machine; startHours: number | undefined },
): string | null {
  if (v === null || Number.isNaN(v)) return "Valor inválido.";
  if (v < 0) return "No puede ser negativo.";
  if (l.max !== undefined && v > l.max) return `Máximo ${l.max} ${l.u}.`;
  if (l.k === "horometro") {
    const last = ctx.machine.horometro_actual;
    if (v < last - 0.05) return `Menor que el último cierre (${last.toFixed(1)} h).`;
    if (v > last + MAX_HOURS_JUMP) return `Salto mayor a ${MAX_HOURS_JUMP} h desde el último cierre.`;
  }
  if (l.k === "horometro_final") {
    const start = ctx.startHours ?? ctx.machine.horometro_actual;
    if (v < start) return `No puede ser menor que el horómetro inicial (${start.toFixed(1)} h).`;
    if (v > start + MAX_HOURS_JUMP) return `Más de ${MAX_HOURS_JUMP} h en un turno.`;
  }
  return null;
}

export function inspectionWarnings(s: InspectionState, nowMs: number): string[] {
  const w: string[] = [];
  const { lect } = s;
  if (
    s.fase === "post" &&
    lect.combustible_pct_final !== undefined &&
    lect.combustible_pct !== undefined &&
    lect.combustible_pct_final > lect.combustible_pct &&
    !lect.combustible_tanqueado
  ) {
    w.push("El combustible final es mayor que el inicial y no se registró tanqueo.");
  }
  if (s.fase === "post" && (lect.horas_parada ?? 0) > 0) w.push("Hay horas de parada: describa el motivo en observaciones.");
  if ((nowMs - new Date(s.inicio).getTime()) / 1000 < SUSPICIOUS_DURATION_S) {
    w.push(`La inspección lleva menos de ${SUSPICIOUS_DURATION_S} s: se marcará para auditoría.`);
  }
  return w;
}
