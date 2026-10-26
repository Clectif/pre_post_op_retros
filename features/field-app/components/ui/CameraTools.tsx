interface CameraToolsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onNote: () => void;
}

const TOOLS = [
  { key: "in", label: "Acercar", icon: "+" },
  { key: "out", label: "Alejar", icon: "−" },
  { key: "reset", label: "Restablecer cámara", icon: "⟲" },
  { key: "note", label: "Nota del registro", icon: "✎" },
] as const;

/** Botones de cámara sobre la escena. La posición la decide StageLayout. */
export function CameraTools({ onZoomIn, onZoomOut, onReset, onNote }: CameraToolsProps) {
  const handlers = { in: onZoomIn, out: onZoomOut, reset: onReset, note: onNote };
  return (
    <div className="flex gap-2">
      {TOOLS.map((t) => (
        <button
          key={t.key}
          type="button"
          aria-label={t.label}
          onClick={handlers[t.key]}
          className="flex size-12 cursor-pointer items-center justify-center rounded-[14px] border border-line bg-panel text-[19px] text-ink shadow-pill active:bg-subtle max-sm:size-11 max-sm:rounded-xl phone-h:size-11 phone-h:rounded-xl"
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
}
