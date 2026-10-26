import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface ModalProps {
  /** Ancho máximo de la tarjeta en px. */
  maxWidth?: number;
  children: ReactNode;
}

/** Fondo oscurecido + tarjeta centrada. Se monta solo mientras está abierto (el padre decide). */
export function Modal({ maxWidth = 440, children }: ModalProps) {
  return (
    // en teléfono la tarjeta aprovecha casi toda la pantalla: menos margen y menos relleno
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-[rgba(18,22,28,.5)] p-[22px] backdrop-blur-[3px] motion-safe:animate-fade-in max-sm:p-2.5">
      <div
        role="dialog"
        aria-modal="true"
        style={{ maxWidth }}
        className="max-h-[92%] w-full overflow-auto overscroll-contain rounded-3xl bg-panel p-[22px] shadow-modal motion-safe:animate-modal-in short:p-4 max-sm:max-h-full max-sm:rounded-[20px] max-sm:p-4"
      >
        {children}
      </div>
    </div>
  );
}

export function ModalTitle({ children }: { children: ReactNode }) {
  return <h3 className="mb-1 text-[19px] font-semibold tracking-[-.01em]">{children}</h3>;
}

export function ModalSub({ children, className }: { children?: ReactNode; className?: string }) {
  return <div className={cn("mb-3 text-[12.5px] leading-[1.4] text-muted", className)}>{children}</div>;
}

export function ModalLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <label className={cn("mt-4 mb-2 block text-[10.5px] font-semibold tracking-[.14em] text-muted uppercase short:mt-3 short:mb-1.5", className)}>
      {children}
    </label>
  );
}

/** Fila de botones pegada al borde inferior de la tarjeta. */
export function ModalActions({ children }: { children: ReactNode }) {
  // el desfase negativo iguala el relleno de la tarjeta (ver Modal) para que la fila toque el borde
  return <div className="sticky -bottom-[22px] mt-[18px] flex gap-2.5 bg-panel pt-3 pb-0.5 short:-bottom-4 max-sm:-bottom-4">{children}</div>;
}
