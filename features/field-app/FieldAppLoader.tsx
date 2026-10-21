"use client";

import dynamic from "next/dynamic";

/**
 * La app depende de IndexedDB, WebGL, GPS y del SDK de Telegram: nada de eso existe en el
 * servidor, así que se carga solo en el cliente (y Three.js queda fuera del bundle inicial).
 */
const FieldApp = dynamic(() => import("./FieldApp"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center gap-3 bg-canvas text-[13px] font-semibold tracking-[.14em] text-muted uppercase">
      <span aria-hidden className="size-[18px] rounded-full border-2 border-line border-t-accent motion-safe:animate-spin" />
      Cargando…
    </div>
  ),
});

export default function FieldAppLoader() {
  return <FieldApp />;
}
