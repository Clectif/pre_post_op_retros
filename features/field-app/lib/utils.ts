export const uuid = (): string =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });

export const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));

export function lsGet<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Deja pasar QuotaExceededError: quien llama decide qué hacer si no cabe. */
export function lsSet(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const formatMB = (bytes: number): string => `${(bytes / 1048576).toFixed(bytes > 10485760 ? 0 : 1)} MB`;

/** Une clases de Tailwind ignorando los valores falsos: cn("a", cond && "b"). */
export const cn = (...parts: (string | false | null | undefined)[]): string => parts.filter(Boolean).join(" ");
