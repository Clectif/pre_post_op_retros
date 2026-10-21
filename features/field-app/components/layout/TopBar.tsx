import type { Fase, Operator, Session, SyncStatus, Tab } from "../../types";
import { PhaseSelector } from "./PhaseSelector";
import { Pill } from "./Pill";
import { SyncPill } from "./SyncPill";
import { TabSwitcher } from "./TabSwitcher";

interface TopBarProps {
  tab: Tab;
  onTabChange: (t: Tab) => void;
  phase: Fase;
  onPhaseChange: (p: Fase) => void;
  session: Session;
  /** Etiqueta del valor de contexto: la zona operativa o el frente de extracción. */
  contextLabel: string;
  contextValue: string;
  operator: Operator;
  syncStatus: SyncStatus;
  pending: number;
  onOpenSetup: () => void;
  onOpenDiagnostics: () => void;
}

export function TopBar(p: TopBarProps) {
  const subtitle = p.session.maq.chasis === "oruga" ? "Excavadora de orugas" : "Retroexcavadora de llantas";
  return (
    <div className="relative z-[6] flex items-center justify-between gap-2.5 px-[18px] py-3 max-[1340px]:gap-2 max-[1340px]:px-3 max-[1340px]:py-2.5">
      <div className="flex shrink-0 flex-col leading-[1.05] max-[1040px]:hidden">
        <b className="text-sm font-bold tracking-[.14em]">
          AHV <span className="text-accent">·</span> CAMPO
        </b>
        <span className="mt-[3px] text-[10px] tracking-[.2em] text-muted uppercase max-[1340px]:hidden">{subtitle}</span>
      </div>

      <TabSwitcher tab={p.tab} onChange={p.onTabChange} />

      <div className="flex flex-wrap items-center justify-center gap-2.5 max-[1340px]:flex-nowrap max-[1340px]:gap-2">
        {p.tab === "inspeccion" && <PhaseSelector phase={p.phase} onChange={p.onPhaseChange} />}
        <Pill label="Máquina" onClick={p.onOpenSetup} valueClassName="max-[1040px]:max-w-[82px]">
          {p.session.maq.nombre}
        </Pill>
        <Pill label="Turno" onClick={p.onOpenSetup}>
          {p.session.turno}
        </Pill>
        <Pill
          label={p.contextLabel}
          onClick={p.onOpenSetup}
          title={p.tab === "extraccion" ? p.session.titulo.nombre : undefined}
          valueClassName="max-[1040px]:max-w-[72px]"
        >
          {p.contextValue}
        </Pill>
      </div>

      <div className="flex items-center gap-2.5">
        <Pill label="Operario" valueClassName="max-[1040px]:max-w-16">
          {p.operator.nombre}
        </Pill>
        <SyncPill status={p.syncStatus} pending={p.pending} onClick={p.onOpenDiagnostics} />
      </div>
    </div>
  );
}
