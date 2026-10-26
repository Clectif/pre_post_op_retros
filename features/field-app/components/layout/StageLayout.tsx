import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface StageLayoutProps {
  /** Lienzo 3D (SceneHost). */
  scene: ReactNode;
  /** Botones de cámara: siempre flotan sobre la escena. */
  tools: ReactNode;
  /** Selector de secciones; opcional. */
  rail?: ReactNode;
  panel: ReactNode;
  /** Barra inferior a todo el ancho. */
  bar: ReactNode;
  /**
   * Apilado: el panel toma su alto natural y la escena se queda con el resto. Sin esto la escena
   * tiene una parte fija y el panel llena lo demás (para listas largas, como la inspección).
   */
  panelFit?: boolean;
}

/** Media query del modo "flotante" (rail y panel encima de la escena). Debe coincidir con `lg:`. */
export const OVERLAY_QUERY = "(min-width: 64rem)";

/**
 * Reparte el escenario según la pantalla, con una sola grilla:
 * - lg+ (tablet acostada, escritorio): la escena ocupa todo y rail, panel y herramientas flotan encima.
 * - Vertical (tablet de pie, teléfono): escena arriba; rail en fila y panel debajo.
 * - Horizontal angosto (teléfono acostado): escena a la izquierda; rail y panel en columna a la derecha.
 */
export function StageLayout({ scene, tools, rail, panel, bar, panelFit }: StageLayoutProps) {
  return (
    <div
      className={cn(
        "grid h-full grid-cols-1 [grid-template-areas:'scene'_'rail'_'panel'_'bar']",
        panelFit
          ? "grid-rows-[minmax(100px,1fr)_auto_minmax(0,auto)_auto]"
          : "grid-rows-[minmax(150px,34%)_auto_minmax(0,1fr)_auto] max-sm:grid-rows-[minmax(130px,28%)_auto_minmax(0,1fr)_auto]",
        "max-lg:landscape:grid-cols-[minmax(0,1fr)_minmax(300px,44%)] max-lg:landscape:grid-rows-[auto_minmax(0,1fr)_auto] max-lg:landscape:[grid-template-areas:'scene_rail'_'scene_panel'_'bar_bar']",
        "lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:grid-rows-[minmax(0,1fr)_auto_auto] lg:[grid-template-areas:'rail_._panel'_'tools_._panel'_'bar_bar_bar']",
      )}
    >
      {/* en lg la escena se extiende detrás de todo, también de la barra translúcida */}
      <div className="relative min-h-0 [grid-area:scene] lg:[grid-area:1/1/-1/-1]">{scene}</div>

      <div className="z-[1] m-3 self-end justify-self-start [grid-area:scene] lg:m-0 lg:mb-3 lg:ml-4 lg:[grid-area:tools]">{tools}</div>

      {rail && <div className="z-[1] flex min-h-0 min-w-0 flex-col [grid-area:rail] lg:justify-center lg:pt-4 lg:pb-3 lg:pl-4">{rail}</div>}

      <div className="z-[1] flex min-h-0 min-w-0 flex-col px-3 pb-3 [grid-area:panel] max-lg:landscape:pt-2 lg:justify-center lg:p-4 lg:pl-0">
        {panel}
      </div>

      <div className="z-[1] min-w-0 [grid-area:bar]">{bar}</div>
    </div>
  );
}
