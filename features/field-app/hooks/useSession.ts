import { useCallback, useMemo, useState } from "react";
import { currentShift } from "../lib/shifts";
import type { Catalog, Selection, Session } from "../types";
import { useNow } from "./useNow";

const INITIAL: Selection = { maqId: null, turno: "1", zona: "explotacion", tituloId: null, zonaId: null };

/** Cruza lo elegido con el catálogo: si algo desapareció (cambió el catálogo) cae a una opción válida. */
function resolveSession(sel: Selection, catalog: Catalog, now: number): Session {
  const maq = catalog.maquinas.find((m) => m.id === sel.maqId) ?? catalog.maquinas[0];
  const titulo = catalog.titulos.find((t) => t.id === sel.tituloId) ?? catalog.titulos[0];
  const zonesOfTitle = catalog.zonas.filter((z) => z.titulo_id === titulo.id && z.activo !== false);
  const zone = catalog.zonas.find((z) => z.id === sel.zonaId && z.titulo_id === titulo.id) ?? zonesOfTitle[0] ?? null;
  const zona = catalog.zonasOperativas[sel.zona] ? sel.zona : Object.keys(catalog.zonasOperativas)[0];
  const turnoOk = catalog.turnos.some((t) => String(t.numero) === String(sel.turno));
  const suggested = currentShift(catalog.turnos, new Date(now));
  const turno = turnoOk ? sel.turno : String(suggested?.numero ?? catalog.turnos[0]?.numero ?? 1);
  return { maq, titulo, turno, zona, zone, zonaId: zone?.id ?? null };
}

/** Máquina, turno, zona operativa, título y frente de la jornada. */
export function useSession(catalog: Catalog) {
  const [selection, setSelection] = useState<Selection>(INITIAL);
  const now = useNow(60_000);

  const session = useMemo(() => resolveSession(selection, catalog, now), [selection, catalog, now]);

  const patch = useCallback((p: Partial<Selection>) => setSelection((s) => ({ ...s, ...p })), []);

  const actions = useMemo(
    () => ({
      setMachine: (maqId: string) => patch({ maqId }),
      setShift: (turno: string) => patch({ turno }),
      setOperativeZone: (zona: string) => patch({ zona }),
      /** Al cambiar de título el frente se reencuadra solo (lo resuelve resolveSession). */
      setTitle: (tituloId: string) => patch({ tituloId, zonaId: null }),
      setZone: (zonaId: string) => patch({ zonaId }),
      restore: (p: Pick<Selection, "maqId" | "turno" | "zona">) => patch(p),
    }),
    [patch],
  );

  return { session, ...actions };
}
