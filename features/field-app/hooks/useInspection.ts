import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { deriveView, nextPendingSection, validateReading } from "../lib/inspection";
import { clearDraft, readDraft, saveDraft } from "../lib/storage/draft";
import { uuid } from "../lib/utils";
import type { Fase, InspectionDraft, InspectionItem, InspectionState, ItemResponse, ReadingDef, Session } from "../types";

// ---------- reducer ----------
type Action =
  | { type: "selectSection"; id: string }
  | { type: "setResponse"; itemId: string; response: ItemResponse }
  | { type: "setReading"; key: string; value: number | undefined }
  | { type: "setWeekly"; value: boolean }
  | { type: "setPhase"; fase: Fase; uuid: string; now: string }
  | { type: "reset"; uuid: string; now: string }
  | { type: "restore"; draft: Pick<InspectionState, "fase" | "semanal" | "lect" | "resp" | "clientUuid" | "inicio"> };

const createState = (): InspectionState => ({
  fase: "pre",
  sec: "LEC",
  resp: {},
  lect: {},
  semanal: false,
  clientUuid: uuid(),
  inicio: new Date().toISOString(),
});

function reducer(s: InspectionState, a: Action): InspectionState {
  switch (a.type) {
    case "selectSection":
      return { ...s, sec: a.id };
    case "setResponse":
      return { ...s, resp: { ...s.resp, [a.itemId]: a.response } };
    case "setReading": {
      const lect = { ...s.lect };
      if (a.value === undefined) delete lect[a.key];
      else lect[a.key] = a.value;
      return { ...s, lect };
    }
    case "setWeekly":
      return { ...s, semanal: s.fase === "post" ? false : a.value };
    case "setPhase":
      // sec "" = "la primera que aplique" (lo resuelve deriveView)
      return { ...s, fase: a.fase, semanal: a.fase === "post" ? false : s.semanal, resp: {}, lect: {}, sec: "", clientUuid: a.uuid, inicio: a.now };
    case "reset":
      return { ...s, resp: {}, lect: {}, sec: "", clientUuid: a.uuid, inicio: a.now };
    case "restore":
      return { ...s, ...a.draft };
  }
}

const revokePhotoUrls = (resp: Record<string, ItemResponse>) =>
  Object.values(resp).forEach((r) => r.fotoUrl && URL.revokeObjectURL(r.fotoUrl));

export interface RestoredDraft {
  machineId: string;
  turno: string;
  zona: string;
  lostPhotos: number;
}

/**
 * Estado y reglas de la inspección (pre/post). Es la única fuente de verdad: la UI y la
 * escena 3D solo leen `state`/`view` y llaman a las acciones.
 */
export function useInspection(session: Session, persist: boolean) {
  const [state, dispatch] = useReducer(reducer, undefined, createState);
  const chasis = session.maq.chasis;
  const view = useMemo(() => deriveView(state, chasis), [state, chasis]);

  // --- borrador: si la app se cierra a medias, el operario retoma donde iba ---
  const { id: machineId } = session.maq;
  const { turno, zona } = session;
  useEffect(() => {
    if (!persist) return;
    const empty = !Object.keys(state.resp).length && !Object.keys(state.lect).length;
    const t = setTimeout(() => {
      if (empty) void clearDraft();
      else
        void saveDraft({
          fase: state.fase,
          maq: machineId,
          turno,
          zona,
          semanal: state.semanal,
          resp: state.resp,
          lect: state.lect,
          uuid: state.clientUuid,
          inicio: state.inicio,
        });
    }, 400);
    return () => clearTimeout(t);
  }, [persist, state, machineId, turno, zona]);

  // --- avance automático: al completar una sección se pasa a la siguiente pendiente ---
  const advanceRequested = useRef(false);
  useEffect(() => {
    if (!advanceRequested.current) return;
    advanceRequested.current = false;
    if (view.status[view.currentSec] === "pend") return;
    const next = nextPendingSection(view);
    if (!next) return;
    const t = setTimeout(() => dispatch({ type: "selectSection", id: next }), 260);
    return () => clearTimeout(t);
  }, [state, view]);

  // --- acciones ---
  const selectSection = useCallback((id: string) => dispatch({ type: "selectSection", id }), []);
  const resetSection = useCallback(() => dispatch({ type: "selectSection", id: "" }), []);
  const setWeekly = useCallback((value: boolean) => dispatch({ type: "setWeekly", value }), []);

  const mark = useCallback((item: InspectionItem, estado: "ok" | "na") => {
    if (estado === "na" && !item.na) return;
    dispatch({ type: "setResponse", itemId: item.id, response: { estado } });
    advanceRequested.current = true;
  }, []);

  const saveFailure = useCallback(
    (item: InspectionItem, response: ItemResponse) => dispatch({ type: "setResponse", itemId: item.id, response }),
    [],
  );

  const setReading = useCallback((key: string, value: number | undefined) => {
    dispatch({ type: "setReading", key, value });
    advanceRequested.current = true;
  }, []);

  const validate = useCallback(
    (l: ReadingDef, v: number | null) => validateReading(l, v, { machine: session.maq, startHours: state.lect.horometro }),
    [session.maq, state.lect.horometro],
  );

  /** Cambia de fase; si hay una inspección en curso pide confirmación antes de descartarla. */
  const changePhase = useCallback(
    (fase: Fase) => {
      if (fase === state.fase) return;
      if (view.progress.done > 0 && !window.confirm("Hay una inspección en curso. ¿Cambiar de fase y descartarla?")) return;
      revokePhotoUrls(state.resp);
      dispatch({ type: "setPhase", fase, uuid: uuid(), now: new Date().toISOString() });
    },
    [state.fase, state.resp, view.progress.done],
  );

  /** Tras enviar: deja la inspección en blanco y borra el borrador. */
  const startNew = useCallback(async () => {
    revokePhotoUrls(state.resp);
    dispatch({ type: "reset", uuid: uuid(), now: new Date().toISOString() });
    await clearDraft();
  }, [state.resp]);

  /** Recupera la inspección en curso. Devuelve lo que hay que restaurar en la sesión, o null si no había. */
  const restoreDraft = useCallback(async (): Promise<RestoredDraft | null> => {
    let d: InspectionDraft | null = null;
    try {
      d = await readDraft();
    } catch {
      /* sin borrador legible */
    }
    if (!d || !d.resp) return null;
    if (Object.keys(d.resp).length + Object.keys(d.lect || {}).length === 0) return null;

    let lostPhotos = 0;
    const resp: Record<string, ItemResponse> = {};
    for (const [k, r] of Object.entries(d.resp)) {
      if (r.fotoPend) {
        lostPhotos++;
        continue;
      }
      resp[k] = r.foto instanceof Blob ? { ...r, fotoUrl: URL.createObjectURL(r.foto) } : r;
    }
    dispatch({
      type: "restore",
      draft: { fase: d.fase, semanal: !!d.semanal, lect: d.lect || {}, resp, clientUuid: d.uuid, inicio: d.inicio },
    });
    return { machineId: d.maq, turno: d.turno, zona: d.zona, lostPhotos };
  }, []);

  return {
    state,
    view,
    selectSection,
    resetSection,
    setWeekly,
    mark,
    saveFailure,
    setReading,
    validate,
    changePhase,
    startNew,
    restoreDraft,
  };
}

export type InspectionController = ReturnType<typeof useInspection>;
