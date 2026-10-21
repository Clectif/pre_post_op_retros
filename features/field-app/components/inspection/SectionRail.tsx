import type { InspectionView, SectionStatus } from "../../lib/inspection";
import { cn } from "../../lib/utils";

const STATUS_BADGE: Record<SectionStatus, string> = {
  done: "bg-ok-soft text-ok-ink",
  fail: "bg-bad-soft text-bad-ink",
  pend: "text-muted",
};

interface SectionRailProps {
  view: InspectionView;
  onSelect: (id: string) => void;
}

/** Lista lateral de sistemas con su avance (hechos/total). Se oculta en pantallas angostas. */
export function SectionRail({ view, onSelect }: SectionRailProps) {
  return (
    <div className="absolute top-[calc(50%-42px)] left-4 max-h-[calc(100%-98px)] w-[252px] -translate-y-1/2 overflow-auto rounded-[20px] border border-line bg-panel p-3 shadow-card max-[1180px]:w-[212px] max-[900px]:hidden">
      <div className="mt-0.5 mb-2.5 text-center text-[10px] font-semibold tracking-[.18em] text-muted uppercase">Sistemas</div>
      <div className="flex flex-col gap-[3px]">
        {view.sections.map((s) => {
          const on = s.id === view.currentSec;
          const { done, total } = view.counts[s.id];
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-[13px] border px-2.5 py-[9px] text-left",
                on ? "border-accent-line bg-accent-soft" : "border-transparent active:bg-subtle",
              )}
            >
              <div className={cn("flex size-[30px] shrink-0 items-center justify-center rounded-[9px] text-[15px]", on ? "bg-white" : "bg-subtle")}>
                {s.ic}
              </div>
              <div className="min-w-0 flex-1">
                <b className={cn("block text-[12.5px] leading-[1.2] font-semibold", on && "text-accent")}>{s.nombre}</b>
                <span className="text-[10.5px] text-muted">{total} puntos</span>
              </div>
              <div className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums", STATUS_BADGE[view.status[s.id]])}>
                {done}/{total}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
