import { DB } from "../../config";
import { withStore } from "./idb";

export interface StorageDiagnostics {
  motor: string;
  blobOk: boolean | null;
  persistente: boolean | null;
  cuota: StorageEstimate | null;
  error: string | null;
}

export const INITIAL_DIAGNOSTICS: StorageDiagnostics = {
  motor: "—",
  blobOk: null,
  persistente: null,
  cuota: null,
  error: null,
};

/** Prueba que la tablet pueda guardar fotos (Blob) sin red y pide almacenamiento persistente. */
export async function probeStorage(): Promise<StorageDiagnostics> {
  const diag: StorageDiagnostics = { ...INITIAL_DIAGNOSTICS };
  try {
    const blob = new Blob([new Uint8Array(64)], { type: "image/jpeg" });
    await withStore(DB.metaStore, "readwrite", (s) => s.put({ b: blob }, "__probe__"));
    const r = await withStore<{ b?: Blob } | undefined>(DB.metaStore, "readonly", (s) => s.get("__probe__"));
    await withStore(DB.metaStore, "readwrite", (s) => s.delete("__probe__"));
    diag.motor = "IndexedDB";
    diag.blobOk = !!(r && r.b instanceof Blob && r.b.size === 64);
  } catch (e) {
    diag.error = String((e as Error)?.message || e);
    try {
      localStorage.setItem("__probe__", "1");
      localStorage.removeItem("__probe__");
      diag.motor = "localStorage (respaldo)";
      diag.blobOk = false;
    } catch {
      diag.motor = "SIN almacenamiento";
      diag.blobOk = false;
    }
  }
  try {
    if (navigator.storage?.persist) diag.persistente = await navigator.storage.persist();
  } catch {
    /* ignorado */
  }
  try {
    if (navigator.storage?.estimate) diag.cuota = await navigator.storage.estimate();
  } catch {
    /* ignorado */
  }
  return diag;
}
