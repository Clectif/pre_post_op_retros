import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface PillProps {
  /** Rótulo pequeño; se oculta en pantallas angostas. */
  label?: string;
  children: ReactNode;
  onClick?: () => void;
  title?: string;
  className?: string;
  /** Clases extra del valor (para recortarlo con puntos suspensivos en pantallas angostas). */
  valueClassName?: string;
}

const BASE =
  "flex min-h-[50px] items-center gap-2 rounded-[14px] border px-4 text-[13px] font-semibold whitespace-nowrap " +
  "max-[1340px]:min-h-[46px] max-[1340px]:min-w-[58px] max-[1340px]:justify-center max-[1340px]:px-3 max-[1340px]:text-[12.5px]";

/** Cápsula de la barra superior: tocable si recibe onClick (tarjeta con flecha), de solo lectura si no (plana). */
export function Pill({ label, children, onClick, title, className, valueClassName }: PillProps) {
  const content = (
    <>
      {label && (
        <small className="text-[10px] font-semibold tracking-[.14em] text-muted uppercase max-[1340px]:hidden">{label}</small>
      )}
      <span className={cn("max-[1340px]:max-w-24 max-[1340px]:truncate", valueClassName)}>{children}</span>
    </>
  );
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(BASE, "cursor-pointer border-line bg-panel shadow-pill active:bg-subtle", className)}
    >
      {content}
      <span aria-hidden className="text-[10px] text-muted max-[1340px]:hidden">
        ▾
      </span>
    </button>
  ) : (
    <div title={title} className={cn(BASE, "border-transparent bg-panel/55", className)}>
      {content}
    </div>
  );
}
