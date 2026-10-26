import { useEffect, useRef } from "react";
import * as THREE from "three";
import { clamp } from "../../lib/utils";
import type { Stage } from "../../types";

const SIZE = 220;

/** "Lupa": granos aleatorios al tamaño relativo del material elegido, para reconocerlo de un vistazo. */
export function Magnifier({ stage }: { stage: Stage }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const g = ref.current?.getContext("2d");
    if (!g) return;
    g.clearRect(0, 0, SIZE, SIZE);
    g.fillStyle = "#faf7f1";
    g.fillRect(0, 0, SIZE, SIZE);
    const base = new THREE.Color(stage.c);
    const n = Math.round(clamp(1400 / (stage.grain * stage.grain), 8, 1100));
    g.globalAlpha = 0.92;
    for (let i = 0; i < n; i++) {
      const radius = stage.grain * (0.6 + Math.random() * 0.8);
      g.fillStyle = `#${base.clone().offsetHSL(0, 0, (Math.random() - 0.5) * 0.18).getHexString()}`;
      g.beginPath();
      g.arc(Math.random() * SIZE, Math.random() * SIZE, radius, 0, 6.283);
      g.fill();
    }
    g.globalAlpha = 1;
  }, [stage]);

  return (
    <canvas
      ref={ref}
      width={SIZE}
      height={SIZE}
      aria-hidden
      className="mt-[13px] mb-1 block aspect-square max-h-[118px] w-full rounded-[14px] border border-line bg-[#faf7f1] short:max-h-[88px] max-sm:max-h-[80px] max-lg:short:hidden"
    />
  );
}
