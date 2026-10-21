import { DB, LS_KEYS } from "../../config";
import type { InspectionDraft, ItemResponse } from "../../types";
import { lsGet, lsSet } from "../utils";
import { withStore } from "./idb";

const DRAFT_KEY = "borrador";

/** Borrador de la inspección en curso: si la app se cierra, el operario retoma donde iba. */
export async function saveDraft(draft: InspectionDraft): Promise<void> {
  try {
    await withStore(DB.metaStore, "readwrite", (s) => s.put(draft, DRAFT_KEY));
    return;
  } catch {
    /* respaldo localStorage: los Blob no caben, se marcan como pendientes */
  }
  const plain: InspectionDraft = { ...draft, resp: {}, sinFotos: false };
  for (const [k, r] of Object.entries(draft.resp)) {
    if (r.foto instanceof Blob) {
      plain.resp[k] = { ...r, foto: null, fotoPend: true } as ItemResponse;
      plain.sinFotos = true;
    } else {
      plain.resp[k] = r;
    }
  }
  try {
    lsSet(LS_KEYS.draft, plain);
  } catch {
    /* sin espacio: el borrador es un extra, no se interrumpe al operario */
  }
}

export async function readDraft(): Promise<InspectionDraft | null> {
  try {
    const d = await withStore<InspectionDraft | undefined>(DB.metaStore, "readonly", (s) => s.get(DRAFT_KEY));
    if (d) return d;
  } catch {
    /* cae al respaldo */
  }
  return lsGet<InspectionDraft | null>(LS_KEYS.draft, null);
}

export async function clearDraft(): Promise<void> {
  try {
    await withStore(DB.metaStore, "readwrite", (s) => s.delete(DRAFT_KEY));
  } catch {
    /* ignorado */
  }
  try {
    localStorage.removeItem(LS_KEYS.draft);
  } catch {
    /* ignorado */
  }
}
