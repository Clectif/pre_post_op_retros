import { DB, LS_KEYS } from "../../config";
import type { RecordBase } from "../../types";
import { lsGet, lsSet } from "../utils";
import { serializeRecord } from "../serialize";
import { withStore } from "./idb";

/**
 * Cola offline única para las dos pestañas: cada registro dice de qué módulo es.
 * IndexedDB primero (guarda fotos como Blob); localStorage de respaldo con fotos en data URL.
 */
export async function saveToQueue(record: RecordBase): Promise<"idb" | "ls"> {
  try {
    await withStore(DB.queueStore, "readwrite", (s) => s.put(record));
    return "idb";
  } catch {
    const plain = await serializeRecord(record);
    const q = lsGet<RecordBase[]>(LS_KEYS.queue, []).filter((x) => x.client_uuid !== plain.client_uuid);
    q.push(plain);
    lsSet(LS_KEYS.queue, q);
    return "ls";
  }
}

export async function readQueue(): Promise<RecordBase[]> {
  let fromDb: RecordBase[] = [];
  try {
    fromDb = (await withStore<RecordBase[]>(DB.queueStore, "readonly", (s) => s.getAll())) || [];
  } catch {
    /* sin IndexedDB: queda solo el respaldo */
  }
  return fromDb.concat(lsGet<RecordBase[]>(LS_KEYS.queue, []));
}

export async function removeFromQueue(id: string): Promise<void> {
  try {
    await withStore(DB.queueStore, "readwrite", (s) => s.delete(id));
  } catch {
    /* ignorado */
  }
  try {
    lsSet(LS_KEYS.queue, lsGet<RecordBase[]>(LS_KEYS.queue, []).filter((x) => x.client_uuid !== id));
  } catch {
    /* ignorado */
  }
}

export async function updateInQueue(record: RecordBase): Promise<void> {
  try {
    await withStore(DB.queueStore, "readwrite", (s) => s.put(record));
    return;
  } catch {
    /* cae al respaldo */
  }
  try {
    lsSet(
      LS_KEYS.queue,
      lsGet<RecordBase[]>(LS_KEYS.queue, []).map((x) => (x.client_uuid === record.client_uuid ? record : x)),
    );
  } catch {
    /* ignorado */
  }
}
