import { cn } from "../../lib/utils";
import type { Fase } from "../../types";

const PHASES: { id: Fase; label: string }[] = [
  { id: "pre", label: "PRE" },
  { id: "post", label: "POST" },
];

export function PhaseSelector({ phase, onChange }: { phase: Fase; onChange: (p: Fase) => void }) {
  return (
    <div className="flex rounded-[14px] border border-line bg-panel p-[3px] shadow-pill">
      {PHASES.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onChange(p.id)}
          className={cn(
            "h-11 cursor-pointer rounded-[11px] px-[22px] text-[13px] font-bold tracking-[.06em]",
            "max-[1340px]:h-[46px] max-[1340px]:px-4 max-[1040px]:px-[13px]",
            phase === p.id ? "bg-accent-soft text-accent" : "text-muted",
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
