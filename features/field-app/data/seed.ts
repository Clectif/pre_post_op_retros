import type { Catalog } from "../types";

/**
 * Arranque en frío: la primera apertura sin red ni caché.
 * Máquinas, títulos y zonas viven en Elasticsearch y llegan por /api/contexto;
 * en cuanto hay señal una vez, la tablet trabaja con lo que guardó en IndexedDB.
 */
export const SEED_CATALOG: Catalog = {
  maquinas: [
    { id: "EXC-320GX", nombre: "CAT 320 GX", chasis: "oruga", horometro_actual: 4182.5, capacidad_balde_m3: 1.19 },
    { id: "EXC-330", nombre: "CAT 330", chasis: "oruga", horometro_actual: 9610.0, capacidad_balde_m3: 1.53 },
    { id: "RET-416E", nombre: "CAT 416E", chasis: "llantas", horometro_actual: 7745.2, capacidad_balde_m3: 0.96 },
  ],
  titulos: [
    { id: "AHV-TITULO-1", nombre: "AHV · Título 1", estado_vigencia: "sin_fecha" },
    { id: "AHV-TITULO-2", nombre: "AHV · Título 2", estado_vigencia: "sin_fecha" },
  ],
  zonas: [],
  turnos: [
    { id: "T1", numero: 1, nombre: "Turno 1", inicio: "06:00", fin: "14:00", activo: true },
    { id: "T2", numero: 2, nombre: "Turno 2", inicio: "14:00", fin: "22:00", activo: true },
    { id: "T3", numero: 3, nombre: "Turno 3", inicio: "22:00", fin: "06:00", activo: true },
  ],
  zonasOperativas: {
    explotacion: "Explotación",
    zona_baja: "Zona baja",
    patio: "Patio / taller",
    via: "Vía pública",
  },
  hash: null,
  ts: null,
  origen: "semilla",
};
