/* eslint-disable @next/next/no-img-element -- la miniatura es un blob: URL local, next/image no aplica */
import { cn } from "../../lib/utils";
import type { Criticidad, Estado, InspectionItem, ItemResponse } from "../../types";

const CARD_BY_STATE: Record<Estado, string> = {
  ok: "border-ok-line bg-ok-soft",
  falla: "border-bad-line bg-bad-soft",
  na: "border-line bg-subtle",
};

const CRIT_STYLES: Record<Criticidad, string> = {
  C: "bg-bad-soft text-bad-ink ring-1 ring-bad-line",
  M: "bg-warn-soft text-warn-ink ring-1 ring-warn-line",
  L: "bg-subtle text-muted ring-1 ring-line",
};

/** Sin marcar, cada botón ya lleva su color en el texto: se reconoce sin leer la etiqueta. */
const BUTTONS: { estado: Estado; label: string; idle: string; selected: string }[] = [
  { estado: "ok", label: "OK", idle: "border-ok-line text-ok-ink", selected: "border-ok bg-ok text-white" },
  { estado: "falla", label: "FALLA", idle: "border-bad-line text-bad-ink", selected: "border-bad bg-bad text-white" },
  { estado: "na", label: "N/A", idle: "border-line text-muted", selected: "border-na bg-na text-white" },
];

interface ItemCardProps {
  item: InspectionItem;
  response: ItemResponse | undefined;
  onMark: (estado: Estado) => void;
  onEditFailure: () => void;
}

export function ItemCard({ item, response, onMark, onEditFailure }: ItemCardProps) {
  return (
    <div
      className={cn(
        "mt-2 rounded-[15px] border px-3 py-[11px] transition-colors duration-200",
        response ? CARD_BY_STATE[response.estado] : "border-line bg-field",
      )}
    >
      <div className="flex items-start gap-2">
        <div className="mt-[3px] shrink-0 text-[9.5px] font-bold tracking-[.06em] text-muted">
          {item.id}
          {item.ref && <span className="ml-1.5 text-[9px] font-bold tracking-[.04em] whitespace-nowrap text-muted/80">F-PR-01 {item.ref}</span>}
          {item.frec === "S" && <span className="ml-1.5 text-[9px] font-bold tracking-[.04em] whitespace-nowrap text-muted/80">SEMANAL</span>}
        </div>
        <div className="flex-1 text-[13px] leading-[1.3] font-medium">{item.txt}</div>
        <div className={cn("shrink-0 rounded-full px-[7px] py-[3px] text-[9px] font-extrabold tracking-[.06em]", CRIT_STYLES[item.crit])}>
          {item.crit}
        </div>
      </div>

      <div className="mt-[9px] flex gap-1.5">
        {BUTTONS.map((b) => (
          <button
            key={b.estado}
            type="button"
            disabled={b.estado === "na" && !item.na}
            onClick={() => onMark(b.estado)}
            className={cn(
              "min-h-12 flex-1 cursor-pointer rounded-xl border p-0 text-[13px] font-bold tracking-[.04em] disabled:opacity-35",
              response?.estado === b.estado ? b.selected : cn("bg-panel", b.idle),
            )}
          >
            {b.label}
          </button>
        ))}
      </div>

      {response?.estado === "falla" && (
        <div className="mt-2 flex items-center gap-2 text-[11.5px] leading-[1.35] text-bad-ink">
          {response.fotoUrl && <img src={response.fotoUrl} alt="Evidencia" className="size-[34px] rounded-lg border border-line object-cover" />}
          <span>{response.obs}</span>
          <button
            type="button"
            onClick={onEditFailure}
            className="ml-auto min-h-9 shrink-0 cursor-pointer rounded-[9px] border border-bad-line bg-panel px-3.5 py-2 text-[11.5px] font-semibold text-bad-ink"
          >
            Editar
          </button>
        </div>
      )}
    </div>
  );
}
