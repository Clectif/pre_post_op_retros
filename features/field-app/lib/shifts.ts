import type { Shift } from "../types";

const toMinutes = (hhmm?: string): number | null => {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(hhmm ?? ""));
  return m ? +m[1] * 60 + +m[2] : null;
};

/**
 * Qué turno corresponde a esta hora. Mismo cálculo que el backend; se resuelve en la
 * tablet porque depende del reloj y no del catálogo. Si dos turnos calzan gana el que
 * arrancó más cerca (el del operario que acaba de entrar).
 */
export function currentShift(shifts: Shift[], at: Date = new Date()): Shift | null {
  const now = at.getHours() * 60 + at.getMinutes();
  let best: Shift | null = null;
  let nearest = Infinity;
  for (const t of shifts) {
    if (t.activo === false) continue;
    const start = toMinutes(t.inicio);
    const end = toMinutes(t.fin);
    if (start === null || end === null) continue;
    const inside = start < end ? now >= start && now < end : now >= start || now < end;
    if (!inside) continue;
    const dist = (((now - start) % 1440) + 1440) % 1440;
    if (dist < nearest) {
      nearest = dist;
      best = t;
    }
  }
  return best;
}

export const shiftLabel = (t: Shift): string =>
  (t.nombre || `Turno ${t.numero}`) + (t.inicio && t.fin ? ` · ${t.inicio} – ${t.fin}` : "");
