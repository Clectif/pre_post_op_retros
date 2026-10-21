import { useEffect, useRef } from "react";
import { cn } from "../../lib/utils";

export interface Option<V extends string> {
  value: V;
  label: string;
  hint?: string | null;
}

interface OptionListProps<V extends string> {
  options: Option<V>[];
  value: V | null;
  onPick: (value: V) => void;
  className?: string;
}

/** Lista de opciones táctiles con una seleccionada. Al montarse acerca la elegida si la lista hace scroll. */
export function OptionList<V extends string>({ options, value, onPick, className }: OptionListProps<V>) {
  const ref = useRef<HTMLDivElement>(null);

  // con una flota larga la elegida puede quedar fuera de la caja: un dedo no hace scroll automático
  useEffect(() => {
    const box = ref.current;
    const on = box?.querySelector<HTMLElement>("[data-on='true']");
    if (box && on && box.scrollHeight > box.clientHeight + 4) {
      box.scrollTop = Math.max(0, on.offsetTop - box.clientHeight / 2 + on.offsetHeight / 2);
    }
  }, []);

  return (
    <div ref={ref} className={className}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            data-on={on}
            onClick={() => onPick(o.value)}
            className={cn(
              "mt-2 flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 rounded-[14px] border px-4 text-left text-sm font-semibold short:min-h-[52px]",
              on
                ? "border-accent bg-accent-soft text-accent after:text-lg after:font-bold after:content-['✓']"
                : "border-line bg-field active:bg-subtle",
            )}
          >
            <span>
              {o.label}
              {o.hint && <small className="ml-1 text-[11px] font-medium text-muted">{o.hint}</small>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Opción deshabilitada que explica por qué no hay nada que elegir. */
export function EmptyOption({ children }: { children: string }) {
  return (
    <div className="mt-2 flex min-h-14 items-center rounded-[14px] border border-line bg-field px-4 text-sm font-semibold opacity-55">
      {children}
    </div>
  );
}
