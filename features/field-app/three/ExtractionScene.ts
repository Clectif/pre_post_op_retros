import * as THREE from "three";
import { STAGES } from "../data/stages";
import { clamp } from "../lib/utils";
import { disposeScene } from "./dispose";
import {
  boulderGeometry,
  labelSprite,
  sandstoneTexture,
  softShadowTexture,
  verticalGradientTexture,
} from "./textures";
import type { SceneController } from "./types";

const PAN_PANEL = 3.2; // el panel derecho tapa ~175 px: se compensa la mirada
const PARTICLES = 200;
const N = STAGES.length;
const hex = (css: string) => new THREE.Color(css).getHex();

interface Particle {
  life: number;
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  s: number; rx: number; ry: number;
}

/**
 * Fila de montones de material, del bloque a la arena muy fina. Arrastrar recorre la fila,
 * tocar un montón lo elige, y registrar baldes lanza partículas del material activo.
 */
export class ExtractionScene implements SceneController {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);

  /** Se reasigna en cada render de la vista para no capturar closures viejos. */
  onPick: (stageIndex: number) => void = () => {};

  private canvas: HTMLCanvasElement | null = null;
  private selected: number;
  private camX: number;
  private camZ = 19;
  /** El operario movió la escena a mano: la cámara deja de seguir al material elegido. */
  private free = false;

  private groups: THREE.Group[] = [];
  /** 0..1: cuánto "levantado" está cada montón (animación suave al elegirlo). */
  private lift: number[] = new Array(N).fill(0);
  private picks: THREE.Mesh[] = [];
  private ring!: THREE.Mesh;
  private particleMesh!: THREE.InstancedMesh;
  private particles: Particle[] = [];
  private readonly tmpColor = new THREE.Color();
  private readonly tmpObj = new THREE.Object3D();

  // gestos
  private pointers = new Map<number, { x: number; y: number }>();
  private mode: "drag" | "pinch" | null = null;
  private moved = false;
  private x0 = 0;
  private panX0 = 0;
  private camX0 = 0;
  private pinchD0 = 0;
  private pinchZ0 = 0;

  constructor(selected: number) {
    this.selected = selected;
    this.camX = STAGES[selected].x + PAN_PANEL;
    this.applyCamera();
    this.build();
  }

  // ---------- construcción ----------
  private build() {
    const { scene } = this;
    scene.background = verticalGradientTexture([[0, "#fbfcfd"], [0.6, "#eef1f4"], [1, "#e3e7eb"]]);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xdfe3e8, 1.05));
    const sun = new THREE.DirectionalLight(0xffffff, 0.6);
    sun.position.set(5, 14, 8);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xeaf0ff, 0.3);
    fill.position.set(-8, 6, 3);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.22);
    rim.position.set(0, 4, -9);
    scene.add(rim);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(140, 90), new THREE.MeshStandardMaterial({ color: 0xeef1f4, roughness: 1 }));
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(1.35, 1.6, 64),
      new THREE.MeshBasicMaterial({ color: 0x2459e0, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
    );
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.02;
    this.ring.position.x = STAGES[this.selected].x;
    scene.add(this.ring);

    const stone = sandstoneTexture();
    const rockMat = new THREE.MeshStandardMaterial({ map: stone, bumpMap: stone, bumpScale: 0.05, roughness: 0.72, metalness: 0.02 });
    const grainMat = new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0 });
    const grainGeo = new THREE.IcosahedronGeometry(1, 0);
    const shadowTex = softShadowTexture();
    const dummy = new THREE.Object3D();
    const R = 0.9;

    STAGES.forEach((st, i) => {
      const g = new THREE.Group();
      g.position.set(st.x, 0, 0);

      const shR = st.rock ? Math.max(R * 1.1, st.vs * 1.5) : R * 1.05;
      const shadow = new THREE.Mesh(
        new THREE.PlaneGeometry(shR * 2.7, shR * 2.7),
        new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.012;
      g.add(shadow);

      const mesh = new THREE.InstancedMesh(st.rock ? boulderGeometry(7.3 * i + 1.5) : grainGeo, st.rock ? rockMat : grainMat, st.cnt);
      const base = new THREE.Color(hex(st.c));
      for (let k = 0; k < st.cnt; k++) {
        const ang = Math.random() * 6.283;
        const rad = R * Math.sqrt(Math.random());
        const mound = st.rock ? 0 : (1 - rad / R) * 0.3;
        const s = st.vs * (0.7 + Math.random() * 0.7);
        dummy.position.set(Math.cos(ang) * rad, mound + s * 0.42 + Math.random() * 0.02, Math.sin(ang) * rad);
        dummy.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        mesh.setMatrixAt(k, dummy.matrix);
        mesh.setColorAt(k, base.clone().offsetHSL((Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.06, (Math.random() - 0.5) * 0.08));
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      g.add(mesh);

      const label = labelSprite(st.short);
      label.position.set(0, 1.85, 0);
      g.add(label);
      this.groups.push(g);
      scene.add(g);

      // caja invisible, tan ancha como el hueco hasta el vecino más cercano, para tocar con el dedo
      const dPrev = i > 0 ? st.x - STAGES[i - 1].x : Infinity;
      const dNext = i < N - 1 ? STAGES[i + 1].x - st.x : Infinity;
      const pick = new THREE.Mesh(new THREE.BoxGeometry(0.92 * Math.min(dPrev, dNext), 4.6, 7), new THREE.MeshBasicMaterial({ visible: false }));
      pick.position.set(st.x, 1.4, 0);
      pick.userData.idx = i;
      scene.add(pick);
      this.picks.push(pick);
    });

    this.particleMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ roughness: 0.9 }), PARTICLES);
    this.particleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(this.particleMesh);
    for (let i = 0; i < PARTICLES; i++) {
      this.particles.push({ life: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, s: 0.04, rx: 0, ry: 0 });
    }
  }

  // ---------- API para la vista ----------
  /** Cambia el material activo; la cámara vuelve a seguirlo. */
  select(index: number) {
    this.selected = index;
    this.free = false;
  }

  /** Lanza `n` partículas del material activo. */
  emit(n: number) {
    const st = STAGES[this.selected];
    const size = Math.max(0.03, st.vs * 0.7);
    let spawned = 0;
    for (let i = 0; i < this.particles.length && spawned < n; i++) {
      const p = this.particles[i];
      if (p.life > 0) continue;
      p.life = 0.55 + Math.random() * 0.5;
      p.x = st.x + (Math.random() - 0.5) * 0.8;
      p.y = 0.5 + Math.random() * 0.5;
      p.z = (Math.random() - 0.5) * 0.8;
      const a = Math.random() * 6.28;
      const v = 1.4 + Math.random() * 2.4;
      p.vx = Math.cos(a) * v * 0.5;
      p.vz = Math.sin(a) * v * 0.5;
      p.vy = 2.2 + Math.random() * 2.2;
      p.s = size * (0.7 + Math.random() * 0.7);
      p.rx = Math.random() * 6;
      p.ry = Math.random() * 6;
      this.tmpColor.set(hex(st.c)).offsetHSL(0, 0, (Math.random() - 0.5) * 0.08);
      this.particleMesh.setColorAt(i, this.tmpColor);
      spawned++;
    }
    if (this.particleMesh.instanceColor) this.particleMesh.instanceColor.needsUpdate = true;
  }

  // ---------- cámara ----------
  private applyCamera() {
    this.camZ = clamp(this.camZ, 9, 34);
    this.camera.position.set(this.camX, 7.6, this.camZ);
    this.camera.lookAt(this.camX, 0.5, 0);
  }

  zoom(factor: number) {
    this.camZ *= factor;
    this.applyCamera();
  }

  reset() {
    this.camZ = 19;
    this.free = false;
    this.applyCamera();
  }

  animate(dt: number) {
    STAGES.forEach((_, i) => {
      const target = i === this.selected ? 1 : 0;
      this.lift[i] += (target - this.lift[i]) * 0.15;
      this.groups[i].position.y = this.lift[i] * 0.12;
      this.groups[i].scale.setScalar(0.94 + this.lift[i] * 0.24);
    });
    this.ring.position.x += (STAGES[this.selected].x - this.ring.position.x) * 0.22;

    if (!this.free) {
      // si el operario movió la escena, la cámara no se la roba
      const goal = STAGES[this.selected].x + PAN_PANEL;
      if (Math.abs(goal - this.camX) > 0.005) {
        this.camX += (goal - this.camX) * 0.12;
        this.applyCamera();
      }
    }

    const dummy = this.tmpObj;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.life > 0) {
        p.life -= dt;
        p.vy -= 9.5 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        p.rx += dt * 4;
        p.ry += dt * 5;
        if (p.y < 0.04) {
          p.y = 0.04;
          p.vy *= -0.3;
          p.vx *= 0.6;
          p.vz *= 0.6;
        }
        dummy.position.set(p.x, p.y, p.z);
        dummy.rotation.set(p.rx, p.ry, 0);
        dummy.scale.setScalar(p.s * clamp(p.life / 0.5, 0, 1));
      } else {
        dummy.position.set(0, -999, 0);
        dummy.scale.setScalar(0);
      }
      dummy.updateMatrix();
      this.particleMesh.setMatrixAt(i, dummy.matrix);
    }
    this.particleMesh.instanceMatrix.needsUpdate = true;
  }

  // ---------- gestos ----------
  attach(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    canvas.addEventListener("pointerdown", this.onDown);
    canvas.addEventListener("pointermove", this.onMove);
    canvas.addEventListener("pointerup", this.onUp);
    canvas.addEventListener("pointercancel", this.onUp);
    canvas.addEventListener("wheel", this.onWheel, { passive: false });
  }

  private onDown = (e: PointerEvent) => {
    this.canvas!.setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      this.pinchD0 = Math.hypot(a.x - b.x, a.y - b.y);
      this.pinchZ0 = this.camZ;
      this.mode = "pinch";
      return;
    }
    this.mode = "drag";
    this.moved = false;
    this.x0 = e.clientX;
    this.panX0 = e.clientX;
    this.camX0 = this.camX;
  };

  private onMove = (e: PointerEvent) => {
    if (!this.pointers.has(e.pointerId)) return;
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.mode === "pinch" && this.pointers.size >= 2) {
      const [a, b] = [...this.pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      this.camZ = this.pinchZ0 * (this.pinchD0 / Math.max(1, d));
      this.applyCamera();
      return;
    }
    if (Math.abs(e.clientX - this.x0) > 10) {
      // arrastre lateral: recorrer la fila de materiales
      this.moved = true;
      const r = this.canvas!.getBoundingClientRect();
      const unitsPerPx = (2 * this.camZ * Math.tan((21 * Math.PI) / 180) * (r.width / r.height)) / r.width;
      this.camX = this.camX0 - (e.clientX - this.panX0) * unitsPerPx;
      this.free = true;
      this.applyCamera();
    }
  };

  private onUp = (e: PointerEvent) => {
    this.pointers.delete(e.pointerId);
    if (this.pointers.size === 0 && this.mode === "pinch") {
      this.mode = null;
      return;
    }
    if (this.moved || this.mode === "pinch" || !this.canvas) return;
    const r = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.camera);
    const hit = ray.intersectObjects(this.picks, false);
    if (hit.length) this.onPick(hit[0].object.userData.idx as number);
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.camZ *= 1 + Math.sign(e.deltaY) * 0.08;
    this.applyCamera();
  };

  dispose() {
    const c = this.canvas;
    if (c) {
      c.removeEventListener("pointerdown", this.onDown);
      c.removeEventListener("pointermove", this.onMove);
      c.removeEventListener("pointerup", this.onUp);
      c.removeEventListener("pointercancel", this.onUp);
      c.removeEventListener("wheel", this.onWheel);
    }
    disposeScene(this.scene);
    this.groups = [];
    this.picks = [];
  }
}
