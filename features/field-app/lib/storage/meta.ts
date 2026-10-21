import { DB, LS_KEYS, WEEKLY_CHECK_MS } from "../../config";
import type { ContextPayload } from "../../types";
import { lsGet, lsSet } from "../utils";
import { withStore } from "./idb";

// ---------- revisión semanal ----------
export async function isWeeklyDue(machineId: string): Promise<boolean> {
  try {
    const d = await withStore<{ ts?: string } | undefined>(DB.metaStore, "readonly", (s) => s.get(`semanal_${machineId}`));
    if (!d || !d.ts) return true;
    return Date.now() - new Date(d.ts).getTime() >= WEEKLY_CHECK_MS;
  } catch {
    return true;
  }
}

export async function markWeeklyDone(machineId: string): Promise<void> {
  try {
    await withStore(DB.metaStore, "readwrite", (s) => s.put({ ts: new Date().toISOString() }, `semanal_${machineId}`));
  } catch {
    /* ignorado */
  }
}

// ---------- caché del catálogo ----------
// La tablet arranca SIEMPRE desde esta copia y solo después pregunta al servidor: sin señal
// en el frente se ve la misma lista que la última vez que hubo red.
interface ContextCache {
  datos: ContextPayload;
  ts: string;
}

export async function readContextCache(): Promise<ContextCache | null> {
  try {
    const d = await withStore<ContextCache | undefined>(DB.metaStore, "readonly", (s) => s.get("contexto"));
    if (d && d.datos) return d;
  } catch {
    /* cae al respaldo */
  }
  const d = lsGet<ContextCache | null>(LS_KEYS.context, null);
  return d && d.datos ? d : null;
}

export async function writeContextCache(datos: ContextPayload): Promise<void> {
  const pack: ContextCache = { datos, ts: new Date().toISOString() };
  try {
    await withStore(DB.metaStore, "readwrite", (s) => s.put(pack, "contexto"));
    return;
  } catch {
    /* cae al respaldo */
  }
  try {
    lsSet(LS_KEYS.context, pack);
  } catch {
    /* ignorado */
  }
}
