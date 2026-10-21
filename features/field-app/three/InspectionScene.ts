import * as THREE from "three";
import { clamp } from "../lib/utils";
import type { PartKey } from "../types";
import { disposeScene } from "./dispose";
import type { SceneController } from "./types";

export type HotspotStatus = "done" | "fail" | "pend";

export interface HotspotSpec {
  id: string;
  icon: string;
}

export interface InspectionSceneView {
  sections: HotspotSpec[];
  status: Record<string, HotspotStatus>;
  selected: string;
  /** Parte de la máquina que se resalta (el resto se atenúa). */
  part: PartKey | null;
}

const HOT_POS: Record<string, [number, number, number]> = {
  LEC: [2.5, 0.9, 2.5],
  MOT: [-1.1, 3.6, -0.4],
  HID: [4.6, 3.9, -0.8],
  ROD: [0.2, 0.3, 2.7],
  FRE: [-2.2, 0.35, 2.5],
  CAB: [1.5, 3.6, 1.5],
  SEG: [3.0, 2.2, 1.7],
  DOC: [-4.0, 2.5, 1.9],
  ENT: [-6.6, 1.3, 4.2],
  CIE: [-2.8, 3.6, -0.5],
};

const HOT_COLORS = { fail: "#d4352f", done: "#0c8558", selected: "#2459e0", idle: "#6b7684" } as const;

interface MatData {
  baseColor: number;
  baseOp: number;
}
type PartMaterial = THREE.MeshStandardMaterial & { userData: Partial<MatData> };

/** Clona el material guardando su color y opacidad base para poder atenuarlo y restaurarlo. */
function tracked(mat: THREE.MeshStandardMaterial): PartMaterial {
  const m = mat.clone() as PartMaterial;
  m.userData = { baseColor: mat.color.getHex(), baseOp: mat.opacity };
  return m;
}

function box(w: number, h: number, d: number, mat: THREE.MeshStandardMaterial, x: number, y: number, z: number, parent: THREE.Object3D) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), tracked(mat));
  m.position.set(x, y, z);
  parent.add(m);
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(m.geometry),
    new THREE.LineBasicMaterial({ color: 0x7d848d, transparent: true, opacity: 0.35 }),
  );
  edges.position.copy(m.position);
  parent.add(edges);
  return m;
}

function cyl(r1: number, r2: number, h: number, mat: THREE.MeshStandardMaterial, x: number, y: number, z: number, rx: number, rz: number, parent: THREE.Object3D) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, 18), tracked(mat));
  m.position.set(x, y, z);
  m.rotation.x = rx || 0;
  m.rotation.z = rz || 0;
  parent.add(m);
  return m;
}

function hotTexture(label: string, color: string, glyph: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 192;
  const x = c.getContext("2d")!;
  x.beginPath();
  x.arc(96, 96, 60, 0, Math.PI * 2);
  x.fillStyle = "rgba(255,255,255,.96)";
  x.fill();
  x.lineWidth = 9;
  x.strokeStyle = color;
  x.stroke();
  x.font = '600 52px -apple-system,Helvetica,Arial';
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillStyle = "#1c1f24";
  x.fillText(glyph, 96, 100);
  x.font = '700 26px -apple-system,Helvetica,Arial';
  x.fillStyle = color;
  x.fillText(label, 96, 168);
  const t = new THREE.CanvasTexture(c);
  t.minFilter = THREE.LinearFilter;
  return t;
}

/**
 * Máquina 3D con un punto táctil por sistema. Orbitar con un dedo, pellizcar para acercar,
 * tocar un punto para elegir su sección. Lo que se pinta lo dicta React vía `setView`.
 */
export class InspectionScene implements SceneController {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(40, 1, 0.1, 400);

  /** Se reasigna en cada render de la vista para no capturar closures viejos. */
  onPick: (sectionId: string) => void = () => {};

  private canvas: HTMLCanvasElement | null = null;
  private parts!: Record<PartKey, THREE.Group>;
  private beacon!: THREE.Mesh;
  private boom!: THREE.Group;
  private stick!: THREE.Group;
  private bucket!: THREE.Group;
  private hotspots: { id: string; sprite: THREE.Sprite }[] = [];
  private view: InspectionSceneView = { sections: [], status: {}, selected: "", part: null };
  private hotKey = "";
  private appliedPart: PartKey | null | undefined;

  private radius = 18;
  private theta = 0.72;
  private phi = 1.08;
  private readonly target = new THREE.Vector3(0, 1.7, 0);
  private tAnim = 0;

  // gestos
  private pointers = new Map<number, { x: number; y: number }>();
  private mode: "orbit" | "pinch" | null = null;
  private last = { x: 0, y: 0 };
  private pressStart = { x: 0, y: 0 };
  private pinchD0 = 0;
  private pinchR0 = 0;

  constructor() {
    this.build();
  }

  // ---------- construcción ----------
  private build() {
    const { scene } = this;
    scene.add(new THREE.HemisphereLight(0xffffff, 0xc4c8cf, 0.95));
    const d1 = new THREE.DirectionalLight(0xffffff, 0.6);
    d1.position.set(9, 15, 7);
    scene.add(d1);
    const d2 = new THREE.DirectionalLight(0xffffff, 0.2);
    d2.position.set(-9, 7, -7);
    scene.add(d2);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(160, 160),
      new THREE.MeshStandardMaterial({ color: 0xe9ebee, roughness: 1 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.02;
    scene.add(floor);

    const mat = {
      amarillo: new THREE.MeshStandardMaterial({ color: 0xe3b53c, roughness: 0.55, metalness: 0.18 }),
      oscuro: new THREE.MeshStandardMaterial({ color: 0x6f757e, roughness: 0.7, metalness: 0.25 }),
      gris: new THREE.MeshStandardMaterial({ color: 0xaab0b8, roughness: 0.6, metalness: 0.3 }),
      cromo: new THREE.MeshStandardMaterial({ color: 0xd6dae0, roughness: 0.25, metalness: 0.75 }),
      vidrio: new THREE.MeshStandardMaterial({ color: 0x9fc0e8, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.5 }),
    };
    this.parts = {
      under: new THREE.Group(),
      house: new THREE.Group(),
      cab: new THREE.Group(),
      front: new THREE.Group(),
      ground: new THREE.Group(),
    };
    Object.values(this.parts).forEach((g) => scene.add(g));
    const { under, house, cab, front, ground } = this.parts;

    // tren de rodaje
    [-1.32, 1.32].forEach((z) => {
      box(4.9, 0.8, 1.0, mat.oscuro, 0, 0.4, z, under);
      box(5.25, 0.18, 1.08, mat.gris, 0, 0.8, z, under);
      cyl(0.4, 0.4, 1.02, mat.gris, 2.45, 0.4, z, Math.PI / 2, 0, under);
      cyl(0.4, 0.4, 1.02, mat.gris, -2.45, 0.4, z, Math.PI / 2, 0, under);
      for (let i = -1.5; i <= 1.5; i += 0.75) cyl(0.17, 0.17, 1.1, mat.cromo, i, 0.12, z, Math.PI / 2, 0, under);
    });
    box(3.2, 0.34, 1.8, mat.oscuro, 0, 0.98, 0, under);

    // casa de máquinas
    box(4.2, 0.34, 2.9, mat.amarillo, -0.25, 1.28, 0, house);
    box(2.7, 1.15, 2.6, mat.amarillo, -0.95, 2.02, 0, house);
    box(0.7, 1.25, 2.6, mat.oscuro, -2.55, 1.98, 0, house);
    box(1.5, 0.1, 2.4, mat.gris, -0.95, 2.63, 0, house);
    cyl(0.18, 0.18, 0.5, mat.cromo, -0.35, 2.85, -0.8, 0, 0, house);

    // cabina
    box(1.25, 1.45, 1.25, mat.amarillo, 0.95, 2.18, 0.78, cab);
    box(1.29, 1.05, 1.29, mat.vidrio, 0.97, 2.38, 0.78, cab);
    box(1.05, 0.06, 1.05, mat.gris, 0.95, 2.93, 0.78, cab);
    this.beacon = cyl(
      0.09, 0.09, 0.16,
      new THREE.MeshStandardMaterial({ color: 0xe8a33d, emissive: 0x8a5b10, emissiveIntensity: 0.6 }),
      0.95, 3.02, 0.78, 0, 0, cab,
    );

    // brazo: boom → stick → bucket
    this.boom = new THREE.Group();
    this.boom.position.set(0.55, 1.85, -0.45);
    this.boom.rotation.z = 0.6;
    front.add(this.boom);
    box(3.4, 0.42, 0.5, mat.amarillo, 1.7, 0, 0, this.boom);
    cyl(0.16, 0.16, 0.62, mat.cromo, 1.2, -0.42, 0, Math.PI / 2, 0, this.boom);
    this.stick = new THREE.Group();
    this.stick.position.set(3.4, 0, 0);
    this.stick.rotation.z = -1.78;
    this.boom.add(this.stick);
    box(2.5, 0.34, 0.4, mat.amarillo, 1.25, 0, 0, this.stick);
    cyl(0.13, 0.13, 0.5, mat.cromo, 0.7, 0.34, 0, Math.PI / 2, 0, this.stick);
    this.bucket = new THREE.Group();
    this.bucket.position.set(2.5, 0, 0);
    this.bucket.rotation.z = -0.95;
    this.stick.add(this.bucket);
    box(0.85, 0.8, 1.0, mat.oscuro, 0.35, -0.25, 0, this.bucket);
    for (let i = -0.36; i <= 0.36; i += 0.18) box(0.22, 0.1, 0.1, mat.cromo, 0.85, -0.55, i, this.bucket);

    // entorno: montículo de arena y conos
    const arena = new THREE.MeshStandardMaterial({ color: 0xc9a273, roughness: 1 });
    cyl(0.5, 3.0, 1.5, arena, -7.6, 0.75, 4.6, 0, 0, ground);
    const cono = new THREE.MeshStandardMaterial({ color: 0xe2703a, roughness: 0.85 });
    const banda = new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.9 });
    [[-4.6, 2.4], [-5.4, 5.2], [-7.2, 7.2]].forEach(([x, z]) => {
      box(0.46, 0.05, 0.46, cono, x, 0.03, z, ground);
      cyl(0.04, 0.2, 0.62, cono, x, 0.34, z, 0, 0, ground);
      cyl(0.13, 0.15, 0.11, banda, x, 0.38, z, 0, 0, ground);
    });

    this.applyCamera();
  }

  // ---------- estado desde React ----------
  setView(view: InspectionSceneView) {
    this.view = view;
    const key = view.sections.map((s) => s.id).join(",");
    if (key !== this.hotKey) this.rebuildHotspots(key);
    else this.paintHotspots();
    if (view.part !== this.appliedPart) this.highlightPart(view.part);
  }

  private rebuildHotspots(key: string) {
    this.hotspots.forEach((h) => {
      this.scene.remove(h.sprite);
      h.sprite.material.map?.dispose();
      h.sprite.material.dispose();
    });
    this.hotspots = [];
    this.hotKey = key;
    this.view.sections.forEach((s) => {
      const p = HOT_POS[s.id];
      if (!p) return;
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: hotTexture(s.id, HOT_COLORS.idle, s.icon), transparent: true, depthTest: false }),
      );
      sprite.position.set(p[0], p[1], p[2]);
      sprite.scale.set(1.15, 1.15, 1);
      this.scene.add(sprite);
      this.hotspots.push({ id: s.id, sprite });
    });
    this.paintHotspots();
  }

  private paintHotspots() {
    const { status, selected, sections } = this.view;
    this.hotspots.forEach((h) => {
      const st = status[h.id];
      const color = st === "fail" ? HOT_COLORS.fail : st === "done" ? HOT_COLORS.done : h.id === selected ? HOT_COLORS.selected : HOT_COLORS.idle;
      const icon = sections.find((s) => s.id === h.id)?.icon ?? "";
      h.sprite.material.map?.dispose();
      h.sprite.material.map = hotTexture(h.id, color, icon);
      h.sprite.material.needsUpdate = true;
      h.sprite.scale.setScalar(h.id === selected ? 1.42 : 1.12);
    });
  }

  /** Atenúa todo menos la parte de la máquina que corresponde a la sección elegida. */
  private highlightPart(key: PartKey | null) {
    this.appliedPart = key;
    Object.entries(this.parts).forEach(([k, g]) => {
      const on = !key || k === key;
      g.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh && mesh.material) {
          const m = mesh.material as PartMaterial;
          if (m.userData?.baseOp === undefined) return;
          m.transparent = m.userData.baseOp < 1 || !on;
          m.opacity = on ? m.userData.baseOp || 1 : 0.62;
          if (m.userData.baseColor !== undefined) m.color.setHex(on ? m.userData.baseColor : 0xc7ccd3);
          if (m.emissive && m !== this.beacon.material) m.emissive.setHex(0x000000);
        }
        if ((o as THREE.LineSegments).isLineSegments) {
          ((o as THREE.LineSegments).material as THREE.LineBasicMaterial).opacity = on ? 0.4 : 0.12;
        }
      });
    });
  }

  // ---------- cámara ----------
  private applyCamera() {
    this.phi = clamp(this.phi, 0.25, 1.5);
    this.radius = clamp(this.radius, 8, 40);
    const { target, radius, phi, theta } = this;
    this.camera.position.set(
      target.x + radius * Math.sin(phi) * Math.sin(theta),
      target.y + radius * Math.cos(phi),
      target.z + radius * Math.sin(phi) * Math.cos(theta),
    );
    this.camera.lookAt(target);
  }

  zoom(factor: number) {
    this.radius *= factor;
    this.applyCamera();
  }

  reset() {
    this.radius = 18;
    this.theta = 0.72;
    this.phi = 1.08;
    this.applyCamera();
  }

  animate() {
    this.tAnim += 0.006;
    const t = this.tAnim;
    this.boom.rotation.z = 0.6 + Math.sin(t) * 0.06;
    this.stick.rotation.z = -1.78 + Math.sin(t * 1.3) * 0.08;
    this.bucket.rotation.z = -0.95 + Math.sin(t * 0.8) * 0.1;
    (this.beacon.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.35 + 0.45 * Math.abs(Math.sin(t * 6));
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
      this.pinchR0 = this.radius;
      this.mode = "pinch";
      return;
    }
    this.mode = "orbit";
    this.last = { x: e.clientX, y: e.clientY };
    this.pressStart = { x: e.clientX, y: e.clientY };
  };

  private onMove = (e: PointerEvent) => {
    if (!this.pointers.has(e.pointerId)) return;
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.mode === "pinch" && this.pointers.size >= 2) {
      const [a, b] = [...this.pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      this.radius = this.pinchR0 * (this.pinchD0 / Math.max(1, d));
      this.applyCamera();
      return;
    }
    if (this.mode === "orbit") {
      this.theta -= (e.clientX - this.last.x) * 0.006;
      this.phi -= (e.clientY - this.last.y) * 0.006;
      this.last = { x: e.clientX, y: e.clientY };
      this.applyCamera();
    }
  };

  private onUp = (e: PointerEvent) => {
    const isTap = Math.hypot(e.clientX - this.pressStart.x, e.clientY - this.pressStart.y) < 8;
    if (this.mode === "orbit" && isTap && this.canvas) {
      const r = this.canvas.getBoundingClientRect();
      const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      const ray = new THREE.Raycaster();
      ray.setFromCamera(ndc, this.camera);
      const hit = ray.intersectObjects(this.hotspots.map((h) => h.sprite), false);
      if (hit.length) {
        const id = this.hotspots.find((h) => h.sprite === hit[0].object)?.id;
        if (id) this.onPick(id);
      }
    }
    this.pointers.delete(e.pointerId);
    if (this.pointers.size === 0) this.mode = null;
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.radius *= 1 + Math.sign(e.deltaY) * 0.08;
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
    this.hotspots = [];
  }
}
