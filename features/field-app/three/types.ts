import type * as THREE from "three";

/** Contrato entre una escena 3D y el hook que le presta el renderer. */
export interface SceneController {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  /** Engancha los gestos (arrastre, pinza, rueda) al canvas. */
  attach(canvas: HTMLCanvasElement): void;
  animate(dt: number): void;
  zoom(factor: number): void;
  reset(): void;
  /** Quita los listeners y libera geometrías, materiales y texturas. */
  dispose(): void;
}
