"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type ShowToast = (message: string) => void;

const ToastContext = createContext<ShowToast | null>(null);

const TOAST_MS = 3400;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState({ message: "", visible: false });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback<ShowToast>((message) => {
    setToast({ message, visible: true });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), TOAST_MS);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed bottom-[120px] left-1/2 z-30 max-w-[min(80%,560px)] max-sm:bottom-[150px] max-sm:w-max max-sm:max-w-[calc(100%-24px)] -translate-x-1/2 rounded-2xl px-5 py-3 text-center text-[13.5px] leading-[1.35] font-medium text-white shadow-modal transition-[opacity,translate] duration-200 ${
          // los avisos que empiezan por ⚠ son fallos de guardado: van en rojo para no confundirse con una confirmación
          toast.message.startsWith("⚠") ? "bg-bad-ink" : "bg-ink"
        } ${toast.visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
      >
        {toast.message}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ShowToast {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}
