/** Tipos de dominio de la app de campo. Los campos en español son los del contrato con ahv_api.py. */

export type Tab = "inspeccion" | "extraccion";
export type Fase = "pre" | "post";
export type Chasis = "oruga" | "llantas";
export type Modulo = "inspeccion" | "extraccion";

// ---------- identidad y sensores ----------
export interface Operator {
  telegram_id: number | null;
  nombre: string;
  username: string | null;
}

export interface Gps {
  lat: number;
  lon: number;
  precision: number;
}

// ---------- catálogos (vienen de /api/contexto) ----------
export interface Machine {
  id: string;
  nombre: string;
  chasis: Chasis;
  horometro_actual: number;
  capacidad_balde_m3: number;
  bloqueada?: boolean;
}

export interface MiningTitle {
  id: string;
  nombre: string;
  estado_vigencia?: string;
  dias_para_vencer?: number | null;
  cupo_pct?: number | null;
  codigo_anm?: string | null;
}

export interface GeoPolygon {
  type: string;
  coordinates: unknown;
}

export interface Zone {
  id: string;
  nombre: string;
  titulo_id: string;
  activo?: boolean;
  estado?: string;
  poligono?: GeoPolygon | null;
}

export interface Shift {
  id: string;
  numero: number;
  nombre?: string;
  inicio?: string;
  fin?: string;
  activo?: boolean;
}

/** Respuesta cruda de /api/contexto. */
export interface ContextPayload {
  maquinas?: Machine[];
  titulos?: MiningTitle[];
  zonas?: Zone[];
  turnos?: Shift[];
  zonas_operativas?: Record<string, string>;
  hash?: string;
}

export type CatalogOrigin = "semilla" | "caché" | "caché al día" | "servidor";

export interface Catalog {
  maquinas: Machine[];
  titulos: MiningTitle[];
  zonas: Zone[];
  turnos: Shift[];
  zonasOperativas: Record<string, string>;
  hash: string | null;
  ts: string | null;
  origen: CatalogOrigin;
}

/** Lo que el operario eligió en el inicio de jornada (ids crudos, sin validar contra el catálogo). */
export interface Selection {
  maqId: string | null;
  turno: string;
  zona: string;
  tituloId: string | null;
  zonaId: string | null;
}

/** La selección ya reconciliada con el catálogo: siempre apunta a cosas que existen. */
export interface Session {
  maq: Machine;
  turno: string;
  zona: string;
  titulo: MiningTitle;
  zonaId: string | null;
  zone: Zone | null;
}

// ---------- inspección ----------
export type Criticidad = "C" | "M" | "L";
export type PartKey = "under" | "house" | "cab" | "front" | "ground";
export type Estado = "ok" | "falla" | "na";

export interface SectionDef {
  id: string;
  ic: string;
  nombre: string;
  desc: string;
  fase: Fase | "ambos";
  part: PartKey | null;
}

export interface InspectionItem {
  id: string;
  sec: string;
  fase: Fase;
  txt: string;
  crit: Criticidad;
  /** Permite marcar N/A. */
  na: boolean;
  /** Solo aplica a este chasis; null = a todos. */
  ch: Chasis | null;
  /** La falla exige foto. */
  foto: boolean;
  ref: string | null;
  frec: "D" | "S";
  inv: boolean;
  sub: string | null;
}

export interface ReadingDef {
  k: string;
  fase: Fase;
  req: boolean;
  lbl: string;
  u: string;
  dec: number;
  max?: number;
  hint?: string;
  ch?: Chasis;
}

export interface ItemResponse {
  estado: Estado;
  obs?: string;
  accion?: string | null;
  sub?: boolean[];
  foto?: Blob | null;
  fotoUrl?: string | null;
  /** La foto no sobrevivió al borrador (respaldo localStorage). */
  fotoPend?: boolean;
}

export type Readings = Record<string, number | undefined>;

export interface InspectionState {
  fase: Fase;
  sec: string;
  resp: Record<string, ItemResponse>;
  lect: Readings;
  semanal: boolean;
  clientUuid: string;
  inicio: string;
}

export type Verdict = "apta" | "obs" | "noapta";

export interface InspectionDraft {
  fase: Fase;
  maq: string;
  turno: string;
  zona: string;
  semanal: boolean;
  resp: Record<string, ItemResponse>;
  lect: Readings;
  uuid: string;
  inicio: string;
  sinFotos?: boolean;
}

// ---------- extracción ----------
export interface Stage {
  cod: string;
  n: string;
  short: string;
  mm: string;
  mm_min: number;
  mm_max: number | null;
  c: string;
  vs: number;
  cnt: number;
  rock: boolean;
  grain: number;
  /** Posición X en la fila 3D (calculada). */
  x: number;
}

/** Conteo de baldes del material en curso. */
export interface ExtractionState {
  /** Índice del material seleccionado en STAGES. */
  sel: number;
  baldes: number;
  /** Nota que acompaña al próximo registro. */
  nota: string | null;
  /** Desde cuándo se acumulan los baldes actuales. */
  inicioTramo: string;
}

// ---------- cola y envío ----------
export interface RecordBase {
  modulo: Modulo;
  client_uuid: string;
  operario: Operator;
  rechazado?: boolean;
  ultimo_error?: string;
  intentos?: number;
  subido_ts?: string;
  subido_por?: number;
  [campo: string]: unknown;
}

export interface SendResult {
  ok: boolean;
  status: number;
  /** Si falló, ¿vale la pena reintentar más tarde? */
  retryable: boolean;
  detail?: string;
  data?: { advertencias?: string[]; [k: string]: unknown };
}

export type SyncStatus = "ok" | "saving" | "off" | "local" | "err" | "cola";

/** "saved": quedó en la tablet y se enviará sola. "failed": ni siquiera se pudo guardar localmente. */
export type SubmitOutcome = { status: "saved" } | { status: "failed" };
