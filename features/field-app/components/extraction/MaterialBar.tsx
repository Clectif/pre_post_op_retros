import { STAGES } from "../../data/stages";
import { cn } from "../../lib/utils";

/** Barra inferior para elegir el material (granulometría). Se desplaza horizontalmente. */
export function MaterialBar({ selected, onSelect }: { selected: number; onSelect: (i: number) => void }) {
  return (
    <div className="absolute inset-x-0 bottom-0 flex gap-2 overflow-x-auto border-t border-line bg-white/90 px-4 pt-2.5 pb-3.5 backdrop-blur-[8px]">
      {STAGES.map((st, i) => {
        const on = i === selected;
        return (
          <button
            key={st.cod}
            type="button"
            onClick={() => onSelect(i)}
            className={cn(
              "flex min-h-[68px] flex-[1_0_124px] cursor-pointer flex-col items-center justify-center gap-[3px] rounded-2xl border px-2 py-1.5",
              on ? "border-accent bg-accent-soft ring-3 ring-accent/15" : "border-line bg-field active:bg-subtle",
            )}
          >
            <i className="mb-0.5 block h-2.5 w-7 rounded-full ring-1 ring-black/10" style={{ background: st.c }} />
            <b className={cn("text-center text-[13.5px] leading-[1.1] font-bold", on && "text-accent")}>{st.short}</b>
            <span className="text-center text-[10.5px] text-muted">{st.mm}</span>
          </button>
        );
      })}
    </div>
  );
}
