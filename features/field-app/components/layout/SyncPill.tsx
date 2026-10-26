import { cn } from "../../lib/utils";
import type { SyncStatus } from "../../types";

const STYLES: Record<SyncStatus, { text: string; dot: string; box: string }> = {
  ok: { text: "text-ok-ink", dot: "bg-ok", box: "border-line bg-panel" },
  saving: { text: "text-accent", dot: "bg-accent motion-safe:animate-pulse", box: "border-line bg-panel" },
  off: { text: "text-warn-ink", dot: "bg-warn", box: "border-warn-line bg-warn-soft" },
  local: { text: "text-muted", dot: "bg-na", box: "border-line bg-panel" },
  cola: { text: "text-accent", dot: "bg-accent", box: "border-accent-line bg-accent-soft" },
  err: { text: "text-bad-ink", dot: "bg-bad", box: "border-bad-line bg-bad-soft" },
};

const LABELS: Record<Exclude<SyncStatus, "cola">, string> = {
  ok: "En nube",
  saving: "Guardando…",
  off: "Sin conexión",
  local: "Local",
  err: "Sin espacio local",
};

interface SyncPillProps {
  status: SyncStatus;
  pending: number;
  onClick: () => void;
}

/** Indicador de sincronización; al tocarlo abre el diagnóstico de la tablet. */
export function SyncPill({ status, pending, onClick }: SyncPillProps) {
  const s = STYLES[status];
  const label = status === "cola" ? `Pendientes: ${pending}` : LABELS[status];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex min-h-[50px] cursor-pointer items-center gap-2 rounded-[14px] border px-4 text-[13px] font-semibold whitespace-nowrap tabular-nums shadow-pill",
        "max-[1340px]:min-h-[46px] max-[1340px]:min-w-[58px] max-[1340px]:justify-center max-[1340px]:px-3 max-[1340px]:text-[12.5px]",
        s.text,
        s.box,
      )}
    >
      <span className={cn("size-[9px] shrink-0 rounded-full", s.dot)} />
      {/* en teléfono solo el punto de color (y el número de pendientes, si los hay) */}
      {status === "cola" ? (
        <span>
          <span className="max-sm:hidden phone-h:hidden">Pendientes: </span>
          {pending}
        </span>
      ) : (
        <span className="max-sm:hidden phone-h:hidden">{label}</span>
      )}
    </button>
  );
}
