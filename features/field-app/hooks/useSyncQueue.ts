import { useCallback, useEffect, useRef, useState } from "react";
import { REQUIRE_TELEGRAM, RETRY_BASE_MS, RETRY_MAX_MS, SYNC_INTERVAL_MS } from "../config";
import { isLocalMode, sendRecord } from "../lib/api";
import { readQueue, removeFromQueue, saveToQueue, updateInQueue } from "../lib/storage/queue";
import type { Operator, RecordBase, SendResult, SubmitOutcome, SyncStatus } from "../types";
import { useToast } from "./useToast";

const IDLE_STATUS: SyncStatus = isLocalMode ? "local" : "ok";

/** Los registros sin fotos pesan poco: suben primero para que los datos no esperen a una foto lenta. */
const hasPhotos = (r: RecordBase) => Array.isArray(r.items) && r.items.some((i: { foto?: unknown }) => !!i.foto);

/**
 * Cola offline "primero guardar, después enviar" (local-first).
 *
 * `submit()` solo escribe en la tablet y vuelve de inmediato: el operario nunca espera a la red.
 * El envío ocurre aparte, en `flush()`, con timeout, un solo envío a la vez y espera creciente
 * entre fallos. Un registro sale de la cola solo cuando el servidor confirma (y el servidor
 * ignora duplicados por `client_uuid`, así que reintentar es seguro).
 */
export function useSyncQueue(operator: Operator, initData: string) {
  const toast = useToast();
  const [status, setStatus] = useState<SyncStatus>(IDLE_STATUS);
  const [pending, setPending] = useState(0);

  const flushing = useRef(false);
  const failures = useRef(0);
  const retryAt = useRef(0);
  /** Llegó un registro mientras se subía otro: al terminar hay que volver a pasar por la cola. */
  const rerun = useRef(false);

  /** Recuenta pendientes y deja el indicador en 'cola' o en reposo (sin pisar un error de espacio). */
  const refreshPending = useCallback(async () => {
    let queue: RecordBase[];
    try {
      queue = await readQueue();
    } catch {
      return;
    }
    setPending(queue.length);
    setStatus((s) => (queue.length ? "cola" : s === "err" ? s : IDLE_STATUS));
  }, []);

  const applyResult = useCallback((r: SendResult) => {
    if (isLocalMode) setStatus("local");
    else if (r.ok) setStatus("ok");
    else setStatus(r.retryable ? "off" : "err");
  }, []);

  /**
   * Sube lo pendiente. Respeta la espera tras un fallo salvo que `force` sea true
   * (botón "Sincronizar ahora" o vuelta de la red). Nunca corren dos a la vez.
   */
  const flush = useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      if (isLocalMode) return;
      if (flushing.current) {
        rerun.current = true;
        return;
      }
      if (!force && Date.now() < retryAt.current) return;
      if (!initData && REQUIRE_TELEGRAM) {
        setStatus("off");
        return;
      }
      flushing.current = true;
      try {
        let queue: RecordBase[];
        try {
          queue = await readQueue();
        } catch {
          return;
        }
        const todo = queue.filter((x) => !x.rechazado).sort((a, b) => Number(hasPhotos(a)) - Number(hasPhotos(b)));
        if (!todo.length) return await refreshPending();

        setStatus("saving");
        let uploaded = 0;
        let firstWarning: string | undefined;
        for (const rec of todo) {
          // la firma de Telegram vence a las 24 h: se sube con la credencial fresca de esta sesión
          const author = (rec.operario as Operator | undefined)?.telegram_id;
          if (operator.telegram_id && author && author !== operator.telegram_id) rec.subido_por = operator.telegram_id;
          rec.subido_ts = new Date().toISOString();
          rec.intentos = (rec.intentos || 0) + 1;

          const r = await sendRecord(rec, initData);
          applyResult(r);
          if (r.ok) {
            await removeFromQueue(rec.client_uuid);
            uploaded++;
            failures.current = 0;
            retryAt.current = 0;
            firstWarning ??= r.data?.advertencias?.[0];
            continue;
          }
          if (!r.retryable) {
            rec.rechazado = true;
            rec.ultimo_error = `HTTP ${r.status} ${r.detail || ""}`;
            await updateInQueue(rec);
            toast("Un registro fue rechazado por el servidor. Revíselo con soporte.");
            continue;
          }
          await updateInQueue(rec);
          // sin señal: espera creciente (5 s, 10 s, 20 s… hasta 2 min) y no se insiste con el resto
          failures.current++;
          retryAt.current = Date.now() + Math.min(RETRY_MAX_MS, RETRY_BASE_MS * 2 ** (failures.current - 1));
          break;
        }
        if (uploaded) {
          toast(firstWarning ? `Sincronizado con aviso: ${firstWarning}` : `${uploaded} registro(s) sincronizado(s).`);
        }
        await refreshPending();
      } finally {
        flushing.current = false;
        if (rerun.current && failures.current === 0) {
          rerun.current = false;
          void flushRef.current({ force: true });
        }
      }
    },
    [initData, operator.telegram_id, applyResult, refreshPending, toast],
  );

  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  });

  /** Guarda el registro en la tablet y lanza el envío en segundo plano. No espera a la red. */
  const submit = useCallback(
    async (record: RecordBase): Promise<SubmitOutcome> => {
      try {
        await saveToQueue(record);
      } catch {
        setStatus("err");
        return { status: "failed" };
      }
      await refreshPending();
      void flush({ force: true });
      return { status: "saved" };
    },
    [flush, refreshPending],
  );

  // reintento periódico (respeta la espera tras fallos)
  useEffect(() => {
    const id = setInterval(() => void flush(), SYNC_INTERVAL_MS);
    return () => clearInterval(id);
  }, [flush]);

  return { status, pending, submit, flush, refreshPending };
}
