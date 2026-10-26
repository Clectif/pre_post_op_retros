import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import type { SceneController } from "./types";

/** Las escenas se encuadraron para un lienzo apaisado; más angosto que esto, se abre el ángulo. */
const MIN_ASPECT = 1.4;
const MAX_FOV = 80;

/**
 * FOV vertical que conserva el ancho visible de MIN_ASPECT cuando el lienzo es más angosto
 * (tablet de pie, teléfono): la máquina no se sale por los lados.
 */
function fitFov(baseFov: number, aspect: number): number {
  if (aspect >= MIN_ASPECT) return baseFov;
  const half = Math.atan((Math.tan(THREE.MathUtils.degToRad(baseFov) / 2) * MIN_ASPECT) / aspect);
  return Math.min(MAX_FOV, THREE.MathUtils.radToDeg(2 * half));
}

/**
 * Presta un renderer WebGL a una escena: crea el canvas dentro de `hostRef`, lo mantiene
 * del tamaño del contenedor, corre el bucle de animación y lo libera todo al desmontar.
 * La escena se crea con `factory` en el montaje; se accede a ella por `sceneRef`.
 */
export function useScene<T extends SceneController>(factory: () => T): {
  hostRef: RefObject<HTMLDivElement | null>;
  sceneRef: RefObject<T | null>;
} {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<T | null>(null);
  const factoryRef = useRef(factory);

  useEffect(() => {
    factoryRef.current = factory;
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) {
      console.error("WebGL no disponible", e);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    const canvas = renderer.domElement;
    canvas.style.display = "block";
    canvas.style.touchAction = "none";
    host.appendChild(canvas);

    const controller = factoryRef.current();
    controller.attach(canvas);
    sceneRef.current = controller;

    const baseFov = controller.camera.fov;
    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      const aspect = w / h;
      controller.camera.aspect = aspect;
      controller.camera.fov = fitFov(baseFov, aspect);
      controller.camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    let raf = 0;
    let prev = performance.now();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      controller.animate(dt);
      renderer.render(controller.scene, controller.camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      controller.dispose();
      sceneRef.current = null;
      renderer.dispose();
      renderer.forceContextLoss(); // la tablet solo aguanta un contexto WebGL vivo
      canvas.remove();
    };
  }, []);

  return { hostRef, sceneRef };
}
