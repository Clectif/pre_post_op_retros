import { DB } from "../../config";

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  const p = new Promise<IDBDatabase>((resolve, reject) => {
    if (!("indexedDB" in window)) return reject(new Error("sin IndexedDB"));
    const req = indexedDB.open(DB.name, DB.version);
    req.onupgradeneeded = () => {
      const d = req.result;
      if (!d.objectStoreNames.contains(DB.queueStore)) d.createObjectStore(DB.queueStore, { keyPath: "client_uuid" });
      if (!d.objectStoreNames.contains(DB.metaStore)) d.createObjectStore(DB.metaStore);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("IndexedDB bloqueada"));
  });
  p.catch(() => {
    dbPromise = null; // permite reintentar si la primera apertura falló
  });
  dbPromise = p;
  return p;
}

/** Ejecuta una operación sobre un object store y espera a que la transacción cierre. */
export async function withStore<T = unknown>(
  store: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest | undefined,
): Promise<T> {
  const d = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = d.transaction(store, mode);
    const req = fn(tx.objectStore(store));
    tx.oncomplete = () => resolve((req ? req.result : undefined) as T);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
