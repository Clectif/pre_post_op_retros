import { cn } from "../../lib/utils";

interface ToggleRowProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** Fila grande con casilla: toda la fila es zona táctil. */
export function ToggleRow({ label, checked, onChange }: ToggleRowProps) {
  return (
    <label
      className={cn(
        "mt-[9px] flex min-h-[54px] cursor-pointer items-center justify-between gap-3 rounded-[13px] border px-3.5 py-3 text-[13px] leading-[1.25] font-semibold",
        "transition-colors duration-150",
        checked ? "border-accent bg-accent-soft" : "border-line bg-field",
      )}
    >
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-8 shrink-0 accent-accent"
      />
    </label>
  );
}
