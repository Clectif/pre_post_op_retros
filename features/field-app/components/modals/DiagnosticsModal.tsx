import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "../../config";
import { readQueue } from "../../lib/storage/queue";
import type { StorageDiagnostics } from "../../lib/storage/diagnostics";
import { formatMB } from "../../lib/utils";
import type { Catalog, Gps, RecordBase } from "../../types";
import { Button } from "../ui/Button";
import { Modal, ModalActions, ModalSub, ModalTitle } from "../ui/Modal";

function Row({ label, value, bad }: { label: string; value: string; bad?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2 text-[12.5px]">
      <span className="shrink-0 text-muted">{label}</span>
      <span className={bad ? "text-right font-semibold break-words text-bad-ink" : "text-right font-semibold break-words"}>{value}</span>
    </div>
  );
}

const SMALL_BUTTON =
  "min-h-[46px] cursor-pointer rounded-[11px] border px-[18px] text-xs font-semibold disabled:opacity-45";

/** Un registro que el servidor rechazó: qué era, por qué, y qué hacer con él. */
function RejectedRecord({ rec, onRetry, onDiscard }: { rec: RecordBase; onRetry: () => Promise<void>; onDiscard: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const what = rec.modulo === "inspeccion" ? `Inspección ${String(rec.tipo ?? "").toUpperCase()}` : "Extracción";
  const when = typeof rec.fin_ts === "string" ? new Date(rec.fin_ts).toLocaleString() : "";
  const run = (fn: () => Promise<void>) => async () => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };
  const discard = () => {
    if (window.confirm(`¿Descartar esta ${what.toLowerCase()} de la tablet? No se podrá recuperar.`)) void run(onDiscard)();
  };

  return (
    <div className="mt-2 rounded-xl border border-bad-line bg-bad-soft px-3 py-2 text-bad-ink">
      <div className="text-[12.5px] font-semibold">
        {what} · {String(rec.maquina_id ?? "")} {when && <span className="font-normal">· {when}</span>}
      </div>
      <div className="mt-1 text-[11.5px] leading-[1.4] break-words">{rec.ultimo_error || "Sin detalle del servidor."}</div>
      <div className="mt-2 flex justify-end gap-2">
        <button type="button" disabled={busy} onClick={discard} className={`${SMALL_BUTTON} border-bad-line bg-panel text-bad-ink active:bg-subtle`}>
          Descartar
        </button>
        <button type="button" disabled={busy} onClick={run(onRetry)} className={`${SMALL_BUTTON} border-line bg-panel text-ink active:bg-subtle`}>
          Reintentar
        </button>
      </div>
    </div>
  );
}

interface DiagnosticsModalProps {
  diagnostics: StorageDiagnostics;
  catalog: Catalog;
  gps: Gps | null;
  gpsIssue: string | null;
  onRetry: (id: string) => Promise<void>;
  onDiscard: (id: string) => Promise<void>;
  onSync: () => void;
  onClose: () => void;
}

/** Estado de la tablet: dónde se guardan los registros mientras no hay red y qué falta por subir. */
export function DiagnosticsModal({ diagnostics: d, catalog, gps, gpsIssue, onRetry, onDiscard, onSync, onClose }: DiagnosticsModalProps) {
  const [queue, setQueue] = useState<RecordBase[]>([]);
  const reload = useCallback(() => readQueue().then(setQueue, () => setQueue([])), []);
  useEffect(() => {
    void reload();
  }, [reload]);

  const rejectedRecords = queue.filter((x) => x.rechazado);
  const rejected = rejectedRecords.length;
  const inspections = queue.filter((x) => x.modulo === "inspeccion").length;
  const extractions = queue.filter((x) => x.modulo === "extraccion").length;
  const storageOk = d.motor === "IndexedDB" && !!d.blobOk;
  const seedOnly = catalog.origen === "semilla";

  return (
    <Modal maxWidth={420}>
      <ModalTitle>Estado de la tablet</ModalTitle>
      <ModalSub>Dónde se están guardando los registros mientras no hay red.</ModalSub>

      <Row label="Motor de almacenamiento" value={d.motor} bad={!storageOk} />
      <Row label="Guarda fotos sin red" value={d.blobOk ? "Sí" : "No — solo texto"} bad={!d.blobOk} />
      <Row
        label="Almacenamiento persistente"
        value={d.persistente === null ? "no disponible" : d.persistente ? "concedido" : "no concedido"}
        bad={d.persistente === false}
      />
      {d.cuota?.quota ? <Row label="Espacio" value={`${formatMB(d.cuota.usage || 0)} de ${formatMB(d.cuota.quota)}`} /> : null}
      <Row
        label="Pendientes"
        value={`${queue.length} (${inspections} inspección · ${extractions} extracción)${rejected ? ` · ${rejected} rechazado/s` : ""}`}
        bad={queue.length > 3 || rejected > 0}
      />
      <Row label="GPS" value={gps ? `±${gps.precision} m` : (gpsIssue ?? "buscando señal…")} bad={!gps} />
      <Row label="Servidor" value={API_BASE || "sin configurar (modo local)"} bad={!API_BASE} />
      <Row
        label="Catálogos"
        value={`${catalog.maquinas.length} máquinas · ${catalog.titulos.length} títulos · ${catalog.zonas.length} frentes`}
        bad={seedOnly}
      />
      <Row
        label="Última actualización"
        value={catalog.ts ? `${new Date(catalog.ts).toLocaleString()} (${catalog.origen})` : "nunca — lista de arranque"}
        bad={seedOnly}
      />
      {d.error && <Row label="Detalle" value={d.error.slice(0, 60)} bad />}

      {rejected > 0 && (
        <div className="mt-3 max-h-[40vh] overflow-auto">
          <div className="text-[12.5px] font-semibold">Rechazados por el servidor</div>
          {rejectedRecords.map((rec) => (
            <RejectedRecord
              key={rec.client_uuid}
              rec={rec}
              onRetry={async () => {
                await onRetry(rec.client_uuid);
                await reload();
              }}
              onDiscard={async () => {
                await onDiscard(rec.client_uuid);
                await reload();
              }}
            />
          ))}
        </div>
      )}

      <ModalActions>
        <Button onClick={onClose}>Cerrar</Button>
        <Button variant="primary" onClick={onSync}>
          Sincronizar ahora
        </Button>
      </ModalActions>
    </Modal>
  );
}
