import { useRef, useState } from "react";
import { useToast } from "../../hooks/useToast";
import { VERDICT_TEXT, type InspectionView } from "../../lib/inspection";
import { cn } from "../../lib/utils";
import type { Catalog, Gps, InspectionState, Operator, Session } from "../../types";
import { VERDICT_STYLES } from "../inspection/verdict";
import { Button } from "../ui/Button";
import { TextArea } from "../ui/fields";
import { Modal, ModalActions, ModalLabel, ModalSub, ModalTitle } from "../ui/Modal";
import { SignaturePad, type SignaturePadHandle } from "./SignaturePad";

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2 text-[12.5px]">
      <span className="text-muted">{label}</span>
      <span className="text-right font-semibold tabular-nums">{value}</span>
    </div>
  );
}

interface SummaryModalProps {
  state: InspectionState;
  view: InspectionView;
  session: Session;
  catalog: Catalog;
  operator: Operator;
  gps: Gps | null;
  /** Por qué no hay GPS (ver useGeolocation); null si se está buscando. */
  gpsIssue: string | null;
  /** Se invoca con las observaciones y la firma; el modal queda bloqueado hasta que termine. */
  onSubmit: (data: { observations: string; signature: string }) => Promise<void>;
  onBack: () => void;
}

export function SummaryModal({ state, view, session, catalog, operator, gps, gpsIssue, onSubmit, onBack }: SummaryModalProps) {
  const toast = useToast();
  const pad = useRef<SignaturePadHandle>(null);
  const [observations, setObservations] = useState("");
  const [busy, setBusy] = useState(false);

  const { verdict, failures, progress } = view;
  const startHours = state.lect.horometro;
  const endHours = state.lect.horometro_final;

  const send = async () => {
    if (!pad.current || pad.current.isEmpty()) {
      // en pantallas bajas la firma queda bajo el pliegue: se lleva la vista hasta ella
      toast("Falta la firma del operario.");
      pad.current?.scrollIntoView();
      return;
    }
    setBusy(true);
    try {
      await onSubmit({ observations, signature: pad.current.toDataURL() });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal>
      <ModalTitle>Cierre de la inspección</ModalTitle>
      <ModalSub>
        {state.fase === "pre" ? "Preoperacional" : "Postoperacional"} · {session.maq.nombre} · Turno {session.turno}
      </ModalSub>

      <div className={cn("my-2.5 inline-block rounded-[11px] px-3.5 py-2 text-[11px] font-extrabold tracking-[.06em]", VERDICT_STYLES[verdict ?? "none"])}>
        {verdict ? VERDICT_TEXT[verdict] : "—"}
      </div>

      <div className="short:max-h-[104px] short:overflow-auto">
        <SummaryRow label="Operario" value={operator.nombre + (operator.telegram_id ? ` · TG ${operator.telegram_id}` : "")} />
        <SummaryRow label="Máquina" value={`${session.maq.nombre} (${session.maq.id})`} />
        <SummaryRow label="Zona" value={catalog.zonasOperativas[session.zona]} />
        <SummaryRow label="Puntos verificados" value={`${progress.done} / ${progress.total}`} />
        <SummaryRow label="Fallas" value={`${failures.length} (${failures.filter((i) => i.crit === "C").length} críticas)`} />
        {startHours !== undefined && <SummaryRow label="Horómetro" value={`${startHours.toFixed(1)} h`} />}
        {endHours !== undefined && (
          <SummaryRow
            label="Horómetro final"
            value={`${endHours.toFixed(1)} h · ${(endHours - (startHours ?? session.maq.horometro_actual)).toFixed(1)} h trabajadas`}
          />
        )}
      </div>

      {!gps && (
        // no bloquea: en el frente puede no haber señal y la inspección igual tiene que salir
        <div className="mt-2 rounded-xl border border-warn-line bg-warn-soft px-3 py-2 text-[11.5px] leading-[1.4] font-medium text-warn-ink">
          ⚠ Sin ubicación GPS: la inspección se enviará sin posición y no aparecerá en el mapa.{" "}
          {gpsIssue ?? "Buscando señal…"}
        </div>
      )}

      <ul className="mt-1.5 list-disc pl-[18px] text-xs leading-normal text-bad-ink short:max-h-14 short:overflow-auto">
        {failures.map((i) => (
          <li key={i.id}>
            <b>{i.id}</b> ({i.crit}) — {(state.resp[i.id].obs ?? "").slice(0, 90)}
          </li>
        ))}
      </ul>

      <ModalLabel>Observaciones generales (opcional)</ModalLabel>
      <TextArea
        className="short:min-h-14"
        value={observations}
        onChange={(e) => setObservations(e.target.value)}
        placeholder="Notas para el supervisor o mantenimiento."
      />

      <ModalLabel>Firma del operario</ModalLabel>
      <SignaturePad ref={pad} />
      <div className="text-right">
        <button
          type="button"
          onClick={() => pad.current?.clear()}
          className="mt-2 min-h-[46px] cursor-pointer rounded-[11px] border border-line bg-panel px-[18px] text-xs font-semibold text-muted active:bg-subtle"
        >
          Borrar firma
        </button>
      </div>

      <ModalActions>
        <Button onClick={onBack} disabled={busy}>
          Volver
        </Button>
        <Button variant="primary" onClick={send} disabled={busy}>
          Enviar
        </Button>
      </ModalActions>
    </Modal>
  );
}
