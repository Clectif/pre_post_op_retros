import { APP_VERSION, CATALOG_VERSION, DEVICE_ID } from "../config";
import { STAGES } from "../data/stages";
import type { ExtractionState, Gps, InspectionState, Operator, RecordBase, Session } from "../types";
import { inspectionWarnings, VERDICT_TEXT, type InspectionView } from "./inspection";
import { uuid } from "./utils";

const operatorOf = (o: Operator): Operator => ({ telegram_id: o.telegram_id, nombre: o.nombre, username: o.username });

interface InspectionRecordArgs {
  state: InspectionState;
  view: InspectionView;
  session: Session;
  operator: Operator;
  gps: Gps | null;
  observations: string;
  /** Firma como data URL PNG. */
  signature: string | null;
}

/** Registro de inspección tal como lo espera POST /api/inspecciones. */
export function buildInspectionRecord(a: InspectionRecordArgs): RecordBase {
  const { state: s, view, session, operator } = a;
  return {
    modulo: "inspeccion",
    client_uuid: s.clientUuid,
    tipo: s.fase,
    maquina_id: session.maq.id,
    chasis: session.maq.chasis,
    turno: session.turno,
    zona: session.zona,
    operario: operatorOf(operator),
    inicio_ts: s.inicio,
    fin_ts: new Date().toISOString(),
    gps: a.gps,
    dispositivo: DEVICE_ID,
    app_version: APP_VERSION,
    catalogo_version: CATALOG_VERSION,
    incluye_semanal: s.semanal,
    lecturas: s.lect,
    items: view.items.map((i) => ({
      codigo: i.id,
      seccion: i.sec,
      criticidad: i.crit,
      ref_formato: i.ref || null,
      frecuencia: i.frec === "S" ? "semanal" : "diaria",
      estado: s.resp[i.id]?.estado || null,
      observacion: s.resp[i.id]?.obs || null,
      accion: s.resp[i.id]?.accion || null,
      foto: s.resp[i.id]?.foto || null,
    })),
    observaciones: a.observations.trim() || null,
    firma: a.signature,
    resultado_cliente: view.verdict ? VERDICT_TEXT[view.verdict] : null,
    advertencias: inspectionWarnings(s, Date.now()),
  };
}

interface ExtractionRecordArgs {
  state: ExtractionState;
  session: Session;
  operator: Operator;
  gps: Gps | null;
}

/** Registro de extracción tal como lo espera POST /api/extraccion/evento. */
export function buildExtractionRecord(a: ExtractionRecordArgs): RecordBase {
  const { state: x, session } = a;
  const st = STAGES[x.sel];
  return {
    modulo: "extraccion",
    client_uuid: uuid(),
    titulo: session.titulo.nombre,
    titulo_id: session.titulo.id,
    zona_id: session.zonaId,
    maquina_id: session.maq.id,
    turno: session.turno,
    zona: session.zona,
    granulometria: { codigo: st.cod, nombre: st.n, idx: x.sel, mm_min: st.mm_min, mm_max: st.mm_max },
    baldes: x.baldes,
    inicio_ts: x.inicioTramo,
    fin_ts: new Date().toISOString(),
    gps: a.gps,
    nota: x.nota,
    operario: operatorOf(a.operator),
    dispositivo: DEVICE_ID,
    app_version: APP_VERSION,
  };
}
