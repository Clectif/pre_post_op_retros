/** Configuración de la app de campo. Lo que cambia por despliegue viene de variables NEXT_PUBLIC_*. */

/** Base del backend: "/backend" es la pasarela de este mismo servidor. Vacío = modo local, sin enviar. */
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
export const DEVICE_ID = process.env.NEXT_PUBLIC_DEVICE_ID ?? "tablet-retro-01";
export const APP_VERSION = "campo-3.0.0";
export const CATALOG_VERSION = "2.0";

/** Si es true, sin initData de Telegram no se habla con el servidor. */
export const REQUIRE_TELEGRAM = true;

export const ROUTES = {
  inspeccion: "/api/inspecciones",
  extraccion: "/api/extraccion/evento",
  contexto: "/api/contexto",
} as const;

export const DB = { name: "ahv_campo", version: 1, queueStore: "cola", metaStore: "meta" } as const;

export const LS_KEYS = {
  queue: "ahv_campo_cola",
  draft: "ahv_campo_borrador",
  context: "ahv_campo_ctx",
} as const;

export const SYNC_INTERVAL_MS = 45_000;
/** Espera máxima por intento de envío: con mala señal es mejor cortar y reintentar que dejar colgado. */
export const SEND_TIMEOUT_MS = 15_000;
/** Los registros con fotos pesan más: se les da más tiempo antes de darlos por fallidos. */
export const SEND_TIMEOUT_PHOTOS_MS = 60_000;
/** Espera entre reintentos tras un fallo: se duplica hasta el tope. */
export const RETRY_BASE_MS = 5_000;
export const RETRY_MAX_MS = 120_000;
export const CATALOG_REFRESH_MS = 600_000;
export const WEEKLY_CHECK_MS = 7 * 864e5;

/** Reglas de negocio de las lecturas e inspecciones. */
export const MAX_HOURS_JUMP = 24;
export const SUSPICIOUS_DURATION_S = 90;
export const PHOTO_MAX_WIDTH = 1280;
export const PHOTO_QUALITY = 0.6;
