import * as THREE from "three";

// Ruido de valor determinista (sin dependencias) para dar textura de arenisca y forma a las rocas.
function rand3(i: number, j: number, k: number): number {
  const s = Math.sin(i * 12.9898 + j * 78.233 + k * 37.719) * 43758.5453;
  return s - Math.floor(s);
}

function valueNoise(x: number, y: number, z: number): number {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (a: number, b: number, d: number) => rand3(xi + a, yi + b, zi + d);
  const x00 = lerp(c(0, 0, 0), c(1, 0, 0), u);
  const x10 = lerp(c(0, 1, 0), c(1, 1, 0), u);
  const x01 = lerp(c(0, 0, 1), c(1, 0, 1), u);
  const x11 = lerp(c(0, 1, 1), c(1, 1, 1), u);
  return lerp(lerp(x00, x10, v), lerp(x01, x11, v), w);
}

/** Ruido fractal: cuatro octavas de ruido de valor. */
export function fbm(x: number, y: number, z: number): number {
  let a = 0, amp = 0.5, f = 1;
  for (let o = 0; o < 4; o++) {
    a += amp * valueNoise(x * f, y * f, z * f);
    f *= 2;
    amp *= 0.5;
  }
  return a;
}

export function sandstoneTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const n = fbm(i / 26, j / 26, 0.5);
      const m = fbm(i / 6 + 3, j / 6 + 7, 1.5);
      const l = Math.max(0.4, Math.min(1.05, 0.72 + 0.3 * n - 0.16 * m));
      const o = (j * size + i) * 4;
      img.data[o] = Math.min(255, l * 220);
      img.data[o + 1] = Math.min(255, l * 192);
      img.data[o + 2] = Math.min(255, l * 152);
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.encoding = THREE.sRGBEncoding;
  return t;
}

/** Roca irregular: una esfera subdividida deformada con ruido. */
export function boulderGeometry(seed: number): THREE.IcosahedronGeometry {
  const g = new THREE.IcosahedronGeometry(1, 2);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = fbm(v.x * 0.9 + seed, v.y * 0.9 + seed * 1.7, v.z * 0.9 + seed * 2.3);
    v.multiplyScalar(1 + (n - 0.5) * 0.5);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

export function labelSprite(text: string): THREE.Sprite {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const x = c.getContext("2d")!;
  x.font = "700 26px Helvetica,Arial";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillStyle = "#1c1f24";
  x.fillText(text, 128, 32);
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sp.scale.set(2.6, 0.62, 1);
  return sp;
}

export function verticalGradientTexture(stops: [number, string][]): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 8;
  c.height = 256;
  const x = c.getContext("2d")!;
  const g = x.createLinearGradient(0, 0, 0, 256);
  stops.forEach(([at, color]) => g.addColorStop(at, color));
  x.fillStyle = g;
  x.fillRect(0, 0, 8, 256);
  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  return t;
}

export function softShadowTexture(): THREE.CanvasTexture {
  const s = 128;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(s / 2, s / 2, 2, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(20,28,40,0.30)");
  g.addColorStop(0.55, "rgba(20,28,40,0.12)");
  g.addColorStop(1, "rgba(20,28,40,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, s, s);
  return new THREE.CanvasTexture(c);
}
