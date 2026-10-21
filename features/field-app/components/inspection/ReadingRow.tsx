import { cn } from "../../lib/utils";
import type { ReadingDef } from "../../types";

interface ReadingRowProps {
  reading: ReadingDef;
  value: number | undefined;
  onOpen: () => void;
}

/** Una lectura numérica (horómetro, combustible…). Tocarla abre el teclado numérico. */
export function ReadingRow({ reading: l, value, onOpen }: ReadingRowProps) {
  const missing = l.req && value === undefined;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "mt-2 flex w-full cursor-pointer items-center gap-2.5 rounded-[15px] border px-3 py-[11px] text-left",
        missing ? "border-bad-line bg-bad-soft" : "border-line bg-field active:bg-subtle",
      )}
    >
      <span className="flex-1">
        <b className="block text-[13px] font-semibold">
          {l.lbl}
          {l.req ? " *" : ""}
        </b>
        <span className={cn("text-[11px]", missing ? "text-bad-ink" : "text-muted")}>{l.hint || (l.req ? "Obligatorio" : "Opcional")}</span>
      </span>
      <span className={cn("min-w-24 text-right text-[22px] font-semibold tabular-nums", value === undefined ? "text-disabled" : "text-accent")}>
        {value === undefined ? "—" : value.toFixed(l.dec)}
        <small className="ml-[3px] text-[11px] font-medium text-muted">{l.u}</small>
      </span>
    </button>
  );
}
