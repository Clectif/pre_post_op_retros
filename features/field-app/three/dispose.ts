import * as THREE from "three";

/** Libera la memoria de GPU de una escena entera (una sola escena viva a la vez en la tablet). */
export function disposeScene(scene: THREE.Scene): void {
  const bg = scene.background as THREE.Texture | THREE.Color | null;
  if (bg && (bg as THREE.Texture).isTexture) {
    (bg as THREE.Texture).dispose();
    scene.background = null;
  }
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    mesh.geometry?.dispose();
    const mats = mesh.material ? (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) : [];
    mats.forEach((m) => {
      for (const v of Object.values(m)) {
        if (v && (v as THREE.Texture).isTexture) (v as THREE.Texture).dispose();
      }
      m.dispose();
    });
  });
}
