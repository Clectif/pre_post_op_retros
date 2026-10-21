import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type Variant = "default" | "primary" | "danger";

const VARIANTS: Record<Variant, string> = {
  default: "border-line bg-panel text-ink active:bg-subtle",
  primary: "border-accent bg-accent text-white shadow-primary disabled:shadow-none",
  danger: "border-bad bg-bad text-white",
};

/** Botón de acción de modal: ancho flexible, alto táctil de 56 px. */
export function Button({
  variant = "default",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={cn(
        "min-h-14 flex-1 cursor-pointer rounded-[14px] border p-0 text-sm font-bold disabled:opacity-45",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
