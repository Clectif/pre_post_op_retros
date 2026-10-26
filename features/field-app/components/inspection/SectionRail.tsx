import { useEffect, useRef } from "react";
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

/**
 * Sistemas con su avance (hechos/total). En pantalla ancha es una tarjeta vertical junto a la máquina;
 * en vertical o en teléfono, una fila de chips que se desplaza de lado.
 */
export function SectionRail({ view, onSelect }: SectionRailProps) {
  const list = useRef<HTMLDivElement>(null);

  // la sección puede cambiar desde la máquina 3D: su chip tiene que quedar a la vista
  useEffect(() => {
    list.current?.querySelector("[data-on='true']")?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [view.currentSec]);

  return (
    <div
      ref={list}
      className={cn(
        "overflow-x-auto px-3 py-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none]",
        "lg:min-h-0 lg:w-[252px] lg:overflow-y-auto lg:rounded-[20px] lg:border lg:border-line lg:bg-panel lg:p-3 lg:shadow-card lg:max-[1180px]:w-[212px]",
      )}
    >
      <div className="mt-0.5 mb-2.5 hidden text-center text-[10px] font-semibold tracking-[.18em] text-muted uppercase lg:block">Sistemas</div>
      <div className="flex gap-1.5 lg:flex-col lg:gap-[3px]">
        {view.sections.map((s) => {
          const on = s.id === view.currentSec;
          const { done, total } = view.counts[s.id];
          return (
            <button
              key={s.id}
              type="button"
              data-on={on}
              onClick={() => onSelect(s.id)}
              className={cn(
                "flex min-h-12 shrink-0 cursor-pointer items-center gap-2.5 rounded-[13px] border px-2.5 py-[9px] text-left",
                on ? "border-accent-line bg-accent-soft" : "border-line bg-panel shadow-pill active:bg-subtle lg:border-transparent lg:shadow-none",
              )}
            >
              <div className={cn("flex size-[30px] shrink-0 items-center justify-center rounded-[9px] text-[15px]", on ? "bg-white" : "bg-subtle")}>
                {s.ic}
              </div>
              <div className="min-w-0 flex-1">
                <b className={cn("block text-[12.5px] leading-[1.2] font-semibold whitespace-nowrap lg:whitespace-normal", on && "text-accent")}>
                  {s.nombre}
                </b>
                <span className="hidden text-[10.5px] text-muted lg:inline">{total} puntos</span>
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
