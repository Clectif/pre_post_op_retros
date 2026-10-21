import { cn } from "../../lib/utils";
import type { Tab } from "../../types";

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: "inspeccion", icon: "🛠", label: "INSPECCIÓN" },
  { id: "extraccion", icon: "⛏", label: "EXTRACCIÓN" },
];

export function TabSwitcher({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="flex shrink-0 rounded-2xl border border-line bg-panel p-1 shadow-pill">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={cn(
            "flex h-12 cursor-pointer items-center gap-2 rounded-xl px-5 text-[13.5px] font-bold tracking-[.05em]",
            "max-[1340px]:h-[46px] max-[1340px]:px-3.5 max-[1340px]:text-[12.5px] max-[1040px]:px-[11px]",
            tab === t.id ? "bg-accent text-white shadow-primary" : "text-muted",
          )}
        >
          <i className="text-[17px] not-italic">{t.icon}</i>
          {t.label}
        </button>
      ))}
    </div>
  );
}
