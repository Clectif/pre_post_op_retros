import { inspectionWarnings, type InspectionView } from "../../lib/inspection";
import type { Estado, InspectionItem, InspectionState, ReadingDef } from "../../types";
import { ItemCard } from "./ItemCard";
import { ReadingRow } from "./ReadingRow";

interface InspectionPanelProps {
  state: InspectionState;
  view: InspectionView;
  /** Hora actual (ms) para los avisos que dependen del tiempo transcurrido. */
  now: number;
  onMark: (item: InspectionItem, estado: Estado) => void;
  onOpenFailure: (item: InspectionItem) => void;
  onOpenReading: (reading: ReadingDef) => void;
}

/** Panel de la sección activa (sus lecturas o sus ítems). La posición la decide StageLayout. */
export function InspectionPanel({ state, view, now, onMark, onOpenFailure, onOpenReading }: InspectionPanelProps) {
  const section = view.sections.find((s) => s.id === view.currentSec);
  const isReadings = view.currentSec === "LEC";
  const warnings = isReadings ? inspectionWarnings(state, now) : [];

  return (
    <div className="flex min-h-0 flex-col rounded-[22px] border border-line bg-panel shadow-card max-lg:flex-1 lg:w-[430px] lg:max-[1180px]:w-[360px]">
      {/* apilado y con poca altura, el chip elegido ya nombra la sección: el encabezado se cede a los ítems */}
      <div className="border-b border-line px-[18px] pt-3.5 pb-2.5 max-sm:px-3.5 max-sm:pt-3 max-sm:pb-2 max-lg:short:hidden">
        <div className="text-[11px] font-semibold tracking-[.16em] text-accent uppercase">
          {state.fase === "pre" ? "Preoperacional" : "Postoperacional"}
        </div>
        <h2 className="mt-[5px] text-[19px] font-semibold tracking-[-.01em] max-sm:text-[17px]">{section?.nombre ?? "—"}</h2>
        <p className="mt-1 text-xs leading-[1.35] text-muted">{section?.desc}</p>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-3 pt-2 pb-3 [-webkit-overflow-scrolling:touch] max-sm:px-2">
        {isReadings ? (
          <>
            {view.readings.map((l) => (
              <ReadingRow key={l.k} reading={l} value={state.lect[l.k]} onOpen={() => onOpenReading(l)} />
            ))}
            {warnings.length > 0 && (
              <div className="mt-2 rounded-xl border border-warn-line bg-warn-soft px-3 py-2 text-[11.5px] leading-[1.4] font-medium text-warn-ink">
                ⚠ {warnings.join(" · ")}
              </div>
            )}
          </>
        ) : (
          view.items
            .filter((i) => i.sec === view.currentSec)
            .map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                response={state.resp[item.id]}
                onMark={(estado) => onMark(item, estado)}
                onEditFailure={() => onOpenFailure(item)}
              />
            ))
        )}
      </div>
    </div>
  );
}
