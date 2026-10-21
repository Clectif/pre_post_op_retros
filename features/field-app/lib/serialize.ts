import type { RecordBase } from "../types";

const blobToDataURL = (b: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(b);
  });

/** Pasa las fotos (Blob) de los ítems a data URL para poder mandarlas como JSON o guardarlas en localStorage. */
export async function serializeRecord(record: RecordBase): Promise<RecordBase> {
  const items = record.items as Record<string, unknown>[] | undefined;
  if (!items) return record;
  const plain: Record<string, unknown>[] = [];
  for (const it of items) {
    plain.push({ ...it, foto: it.foto instanceof Blob ? await blobToDataURL(it.foto) : it.foto || null });
  }
  return { ...record, items: plain };
}
