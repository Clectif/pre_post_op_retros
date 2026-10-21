import { cn } from "../../lib/utils";

interface CameraToolsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onNote: () => void;
  /** Clase de posición vertical: cada vista tiene una barra inferior de distinta altura. */
  className: string;
}

const TOOLS = [
  { key: "in", label: "Acercar", icon: "+" },
  { key: "out", label: "Alejar", icon: "−" },
  { key: "reset", label: "Restablecer cámara", icon: "⟲" },
  { key: "note", label: "Nota del registro", icon: "✎" },
] as const;

export function CameraTools({ onZoomIn, onZoomOut, onReset, onNote, className }: CameraToolsProps) {
  const handlers = { in: onZoomIn, out: onZoomOut, reset: onReset, note: onNote };
  return (
    <div className={cn("absolute left-4 flex gap-2", className)}>
      {TOOLS.map((t) => (
        <button
          key={t.key}
          type="button"
          aria-label={t.label}
          onClick={handlers[t.key]}
          className="flex size-12 cursor-pointer items-center justify-center rounded-[14px] border border-line bg-panel text-[19px] text-ink shadow-pill active:bg-subtle"
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
}
