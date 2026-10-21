import { useCallback, useState } from "react";
import { STAGES } from "../data/stages";
import type { ExtractionState } from "../types";

export type SelectResult = "changed" | "same" | "cancelled";

/** Conteo de baldes del material en curso. Vive aquí (y no en la vista) para sobrevivir al cambio de pestaña. */
export function useExtraction() {
  const [state, setState] = useState<ExtractionState>(() => ({
    sel: 0,
    baldes: 0,
    nota: null,
    inicioTramo: new Date().toISOString(),
  }));

  const select = useCallback(
    (i: number): SelectResult => {
      if (i === state.sel) return "same";
      if (state.baldes > 0 && !window.confirm(`Hay ${state.baldes} baldes sin registrar de ${STAGES[state.sel].n}. ¿Cambiar de material y descartarlos?`)) {
        return "cancelled";
      }
      setState((s) => ({ ...s, sel: i, baldes: 0, inicioTramo: new Date().toISOString() }));
      return "changed";
    },
    [state.sel, state.baldes],
  );

  const addBuckets = useCallback((n: number) => setState((s) => ({ ...s, baldes: Math.max(0, s.baldes + n) })), []);
  const clearBuckets = useCallback(() => setState((s) => ({ ...s, baldes: 0 })), []);
  const setNote = useCallback((nota: string | null) => setState((s) => ({ ...s, nota })), []);
  /** Tras registrar: contador y nota en cero, nuevo tramo. */
  const afterRegistered = useCallback(
    () => setState((s) => ({ ...s, baldes: 0, nota: null, inicioTramo: new Date().toISOString() })),
    [],
  );

  return { state, select, addBuckets, clearBuckets, setNote, afterRegistered };
}

export type ExtractionController = ReturnType<typeof useExtraction>;
