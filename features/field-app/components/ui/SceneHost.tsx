import type { RefObject } from "react";

/** Contenedor donde useScene() monta el canvas WebGL; ocupa todo el escenario. */
export function SceneHost({ hostRef }: { hostRef: RefObject<HTMLDivElement | null> }) {
  return <div ref={hostRef} className="absolute inset-0" />;
}
