import { VERDICT_TEXT, type InspectionView } from "../../lib/inspection";
import { cn } from "../../lib/utils";
import { VERDICT_STYLES } from "./verdict";

interface BottomBarProps {
  view: InspectionView;
  weekly: boolean;
  onSend: () => void;
}

/** Barra inferior: avance, veredicto parcial y botón para firmar y enviar. */
export function BottomBar({ view, weekly, onSend }: BottomBarProps) {
  const { done, total } = view.progress;
  const verdict = view.verdict;
  const complete = total > 0 && done >= total;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 border-t border-line bg-white/90 px-[18px] py-[11px] backdrop-blur-[8px] max-sm:gap-x-2.5 max-sm:px-3 phone-h:py-2">
      {/* en teléfono el avance ocupa su propia fila y veredicto + botón van debajo */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 max-sm:basis-full">
        <div className="flex justify-between gap-3 text-[11.5px] text-muted">
          <span className="min-w-0 truncate">
            Avance<span className="max-sm:hidden"> de la inspección</span>
            {weekly ? " · incluye revisión semanal" : ""}
          </span>
          <span className="shrink-0 tabular-nums">
            <b className="font-semibold text-ink">{done}</b> / <span>{total}</span>
            {total > 0 && (
              <span className={cn("ml-2 font-semibold", complete ? "text-ok-ink" : "text-ink")}>
                {complete ? "✓ Completa" : `Faltan ${total - done}`}
              </span>
            )}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-line">
          <div
            className={cn("h-full rounded-full transition-[width,background-color] duration-300", complete ? "bg-ok" : "bg-accent")}
            style={{ width: `${total ? (done / total) * 100 : 0}%` }}
          />
        </div>
      </div>
      <div className={cn("rounded-xl px-4 py-[9px] text-xs font-extrabold tracking-[.06em] whitespace-nowrap", VERDICT_STYLES[verdict ?? "none"])}>
        {verdict ? VERDICT_TEXT[verdict] : "SIN EVALUAR"}
      </div>
      <button
        type="button"
        disabled={done < total || total === 0}
        onClick={onSend}
        className="min-h-[52px] cursor-pointer rounded-[14px] bg-accent px-[30px] text-sm font-bold whitespace-nowrap text-white shadow-primary disabled:bg-line disabled:text-muted disabled:shadow-none max-sm:flex-1 max-sm:px-4"
      >
        Firmar y enviar
      </button>
    </div>
  );
}
