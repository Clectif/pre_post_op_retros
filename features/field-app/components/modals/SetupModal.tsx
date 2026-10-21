import { useEffect, useMemo, useState } from "react";
import { useNow } from "../../hooks/useNow";
import type { useSession } from "../../hooks/useSession";
import { currentShift, shiftLabel } from "../../lib/shifts";
import { setupNotices, titleSubtitle, zoneSubtitle } from "../../lib/setup-notices";
import { isWeeklyDue } from "../../lib/storage/meta";
import { cn } from "../../lib/utils";
import type { Catalog, Gps, Session } from "../../types";
import { Button } from "../ui/Button";
import { EmptyOption, OptionList, type Option } from "../ui/OptionList";
import { Modal, ModalActions, ModalLabel, ModalSub, ModalTitle } from "../ui/Modal";
import { ToggleRow } from "../ui/ToggleRow";

type SessionActions = Omit<ReturnType<typeof useSession>, "session">;

interface SetupModalProps {
  catalog: Catalog;
  session: Session;
  actions: SessionActions;
  gps: Gps | null;
  onStart: (includeWeekly: boolean) => void;
  /** Cierra sin reiniciar la inspección; lo ya elegido queda aplicado. Sin él no hay ✕ (apertura de arranque). */
  onClose?: () => void;
}

const LIST = "max-h-[206px] overflow-auto [-webkit-overflow-scrolling:touch]";

/** Inicio de jornada: máquina, turno, zona, título y frente. Los cambios aplican de inmediato. */
export function SetupModal({ catalog, session, actions, gps, onStart, onClose }: SetupModalProps) {
  const now = useNow(60_000);
  const suggestedShift = currentShift(catalog.turnos, new Date(now));

  const [weeklyDue, setWeeklyDue] = useState(true);
  const [weekly, setWeekly] = useState(false);
  useEffect(() => {
    let alive = true;
    void isWeeklyDue(session.maq.id).then((due) => {
      if (!alive) return;
      setWeeklyDue(due);
      setWeekly(due);
    });
    return () => {
      alive = false;
    };
  }, [session.maq.id]);

  const machines = useMemo<Option<string>[]>(
    () =>
      catalog.maquinas.map((m) => ({
        value: m.id,
        label: m.nombre,
        hint: `${m.bloqueada ? "con novedad crítica · " : ""}balde ${(+(m.capacidad_balde_m3 || 0)).toFixed(2)} m³`,
      })),
    [catalog.maquinas],
  );
  const shifts = useMemo<Option<string>[]>(
    () =>
      catalog.turnos.map((t) => ({
        value: String(t.numero),
        label: shiftLabel(t),
        hint: suggestedShift?.numero === t.numero ? "corresponde ahora" : null,
      })),
    [catalog.turnos, suggestedShift?.numero],
  );
  const operativeZones = useMemo<Option<string>[]>(
    () => Object.entries(catalog.zonasOperativas).map(([value, label]) => ({ value, label })),
    [catalog.zonasOperativas],
  );
  const titles = useMemo<Option<string>[]>(
    () => catalog.titulos.map((t) => ({ value: t.id, label: t.nombre, hint: titleSubtitle(t) })),
    [catalog.titulos],
  );
  const zones = useMemo<Option<string>[]>(
    () =>
      catalog.zonas
        .filter((z) => z.titulo_id === session.titulo.id && z.activo !== false)
        .map((z) => ({ value: z.id, label: z.nombre, hint: zoneSubtitle(z) })),
    [catalog.zonas, session.titulo.id],
  );

  const notices = setupNotices(session.titulo, session.zone, gps);

  return (
    <Modal maxWidth={860}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <ModalTitle>Inicio de jornada</ModalTitle>
          <ModalSub>Confirme máquina y turno. Aplican a la inspección y a la extracción.</ModalSub>
        </div>
        {onClose && (
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="-mt-1.5 -mr-1.5 grid size-10 shrink-0 place-items-center rounded-full text-[18px] leading-none text-muted hover:bg-black/5 active:bg-black/10"
          >
            ✕
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 max-[860px]:grid-cols-1">
        <div>
          <ModalLabel className="mt-1">Máquina</ModalLabel>
          <OptionList className={LIST} options={machines} value={session.maq.id} onPick={actions.setMachine} />
        </div>
        <div>
          <ModalLabel className="mt-1">Turno</ModalLabel>
          <OptionList className={LIST} options={shifts} value={session.turno} onPick={actions.setShift} />
          <ModalLabel>Zona de trabajo</ModalLabel>
          <OptionList options={operativeZones} value={session.zona} onPick={actions.setOperativeZone} />
        </div>
        <div>
          <ModalLabel className="mt-1">Título minero</ModalLabel>
          <OptionList className={LIST} options={titles} value={session.titulo.id} onPick={actions.setTitle} />
          <ModalLabel>Frente de extracción</ModalLabel>
          {catalog.zonas.length === 0 ? (
            <EmptyOption>Sin frentes cargados</EmptyOption>
          ) : zones.length === 0 ? (
            <EmptyOption>Este título no tiene frentes</EmptyOption>
          ) : (
            <OptionList key={session.titulo.id} className={LIST} options={zones} value={session.zonaId} onPick={actions.setZone} />
          )}
        </div>
      </div>

      {notices.messages.length > 0 && (
        <div
          className={cn(
            "mt-3 rounded-xl border px-3.5 py-3 text-[13.5px] leading-[1.45] font-medium",
            notices.blocking ? "border-bad-line bg-bad-soft text-bad-ink" : "border-warn-line bg-warn-soft text-warn-ink",
          )}
        >
          {notices.messages.join(" ")}
        </div>
      )}

      <ToggleRow
        label={`Incluir revisión semanal (${weeklyDue ? "corresponde hoy" : "ya se hizo esta semana"})`}
        checked={weekly}
        onChange={setWeekly}
      />

      <ModalActions>
        <Button variant="primary" onClick={() => onStart(weekly)}>
          Comenzar
        </Button>
      </ModalActions>
    </Modal>
  );
}
