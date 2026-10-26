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
    // por debajo de lg no cabe en una fila: arriba pestañas y estado, abajo el contexto (se desplaza de lado si hace falta).
    // Con el teléfono acostado no hay altura para dos filas: el contexto vuelve a la fila y se desplaza ahí.
    <div className="relative z-[6] flex flex-wrap items-center justify-between gap-2.5 px-[18px] py-3 max-[1340px]:gap-2 max-[1340px]:px-3 max-[1340px]:py-2.5 max-sm:gap-y-1.5 max-sm:py-2">
      <div className="flex shrink-0 flex-col leading-[1.05] max-[1040px]:hidden">
        <b className="text-sm font-bold tracking-[.14em]">
          AHV <span className="text-accent">·</span> CAMPO
        </b>
        <span className="mt-[3px] text-[10px] tracking-[.2em] text-muted uppercase max-[1340px]:hidden">{subtitle}</span>
      </div>

      <TabSwitcher tab={p.tab} onChange={p.onTabChange} />

      <div className="flex flex-wrap items-center justify-center gap-2.5 max-[1340px]:flex-nowrap max-[1340px]:gap-2 max-lg:order-last max-lg:-mx-3 max-lg:w-[calc(100%+1.5rem)] max-lg:justify-start max-lg:overflow-x-auto max-lg:px-3 max-lg:py-1 max-lg:[scrollbar-width:none] max-lg:*:shrink-0 phone-h:order-none phone-h:mx-0 phone-h:w-auto phone-h:min-w-0 phone-h:flex-1 phone-h:px-0.5">
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

      <div className="flex items-center gap-2.5 max-[1340px]:gap-2">
        {/* en teléfono el nombre del operario cede su sitio: igual consta en el resumen al firmar */}        <Pill label="Operario" className="max-sm:hidden phone-h:hidden" valueClassName="max-[1040px]:max-w-16 max-lg:max-w-32">
          {p.operator.nombre}
        </Pill>
        <SyncPill status={p.syncStatus} pending={p.pending} onClick={p.onOpenDiagnostics} />
      </div>
    </div>
  );
}
