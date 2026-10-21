import { useEffect, useState } from "react";
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

interface DiagnosticsModalProps {
  diagnostics: StorageDiagnostics;
  catalog: Catalog;
  gps: Gps | null;
  onSync: () => void;
  onClose: () => void;
}

/** Estado de la tablet: dónde se guardan los registros mientras no hay red y qué falta por subir. */
export function DiagnosticsModal({ diagnostics: d, catalog, gps, onSync, onClose }: DiagnosticsModalProps) {
  const [queue, setQueue] = useState<RecordBase[]>([]);
  useEffect(() => {
    void readQueue().then(setQueue, () => setQueue([]));
  }, []);

  const rejected = queue.filter((x) => x.rechazado).length;
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
      <Row label="GPS" value={gps ? `±${gps.precision} m` : "sin señal"} bad={!gps} />
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

      <ModalActions>
        <Button onClick={onClose}>Cerrar</Button>
        <Button variant="primary" onClick={onSync}>
          Sincronizar ahora
        </Button>
      </ModalActions>
    </Modal>
  );
}
