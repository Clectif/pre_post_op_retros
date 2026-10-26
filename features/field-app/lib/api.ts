import { API_BASE, REQUIRE_TELEGRAM, ROUTES, SEND_TIMEOUT_MS, SEND_TIMEOUT_PHOTOS_MS } from "../config";
import type { ContextPayload, RecordBase, SendResult } from "../types";
import { serializeRecord } from "./serialize";

const headers = (initData: string) => ({ "Content-Type": "application/json", "X-Telegram-Init-Data": initData });

/** Sin URL de backend la app corre en modo local: todo queda en la cola del dispositivo. */
export const isLocalMode = !API_BASE;

const hasPhotos = (r: RecordBase) =>
  Array.isArray(r.items) && r.items.some((i: { foto?: unknown }) => !!i.foto);

/**
 * El `detail` de un error del backend, en texto que el operario o soporte puedan leer:
 * - reglas de negocio: {mensaje, errores: ["MOT-03: …", …]}
 * - formato (FastAPI): [{loc: ["body", "turno"], msg: "Field required"}, …]
 */
function describeDetail(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((e: { loc?: unknown[]; msg?: string }) => `${(e.loc ?? []).filter((x) => x !== "body").join(".")}: ${e.msg ?? ""}`)
      .join(" · ");
  }
  if (detail && typeof detail === "object") {
    const d = detail as { mensaje?: string; errores?: string[] };
    if (Array.isArray(d.errores) && d.errores.length) return d.errores.join(" · ");
    if (d.mensaje) return d.mensaje;
  }
  return JSON.stringify(detail ?? "");
}

/** Un envío que supera el timeout cuenta como fallo reintentable (status 0), igual que una caída de red. */
export async function sendRecord(record: RecordBase, initData: string): Promise<SendResult> {
  if (isLocalMode) {
    console.log("REGISTRO", record);
    return { ok: false, status: 0, retryable: true };
  }
  let plain: RecordBase;
  try {
    plain = await serializeRecord(record);
  } catch {
    return { ok: false, status: 0, retryable: true };
  }
  const { modulo, ...body } = plain;
  try {
    const r = await fetch(API_BASE + ROUTES[modulo], {
      method: "POST",
      headers: headers(initData),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(hasPhotos(record) ? SEND_TIMEOUT_PHOTOS_MS : SEND_TIMEOUT_MS),
    });
    if (r.ok) return { ok: true, status: r.status, retryable: false, data: await r.json() };
    let detail = "";
    try {
      detail = describeDetail((await r.json()).detail).slice(0, 600);
    } catch {
      /* cuerpo sin JSON */
    }
    // 401/403 = firma de Telegram vencida; 429/5xx = servidor ocupado: se reintenta. El resto es rechazo.
    const retryable = r.status === 401 || r.status === 403 || r.status === 429 || r.status >= 500;
    return { ok: false, status: r.status, retryable, detail };
  } catch {
    return { ok: false, status: 0, retryable: true };
  }
}

/** Devuelve el catálogo del servidor, o null si no hay red, credenciales o respuesta válida. */
export async function fetchContext(initData: string): Promise<ContextPayload | null> {
  if (isLocalMode) return null;
  if (!initData && REQUIRE_TELEGRAM) return null;
  try {
    const r = await fetch(API_BASE + ROUTES.contexto, {
      headers: { "X-Telegram-Init-Data": initData },
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    return r.ok ? ((await r.json()) as ContextPayload) : null;
  } catch {
    return null;
  }
}
