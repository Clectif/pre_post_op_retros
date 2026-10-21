import type { Gps, MiningTitle, Zone } from "../types";
import { pointInPolygon } from "./geo";

const VALIDITY_LABEL: Record<string, string> = {
  vencido: "vencido",
  por_vencer: "por vencer",
  vigente: "vigente",
  sin_fecha: "sin vigencia cargada",
};

/** Resumen de una línea del estado del título: vigencia, cupo y código ANM. */
export function titleSubtitle(t: MiningTitle): string | null {
  const parts: string[] = [];
  if (t.estado_vigencia === "por_vencer" && t.dias_para_vencer != null) parts.push(`vence en ${t.dias_para_vencer} días`);
  else if (t.estado_vigencia && t.estado_vigencia !== "vigente") parts.push(VALIDITY_LABEL[t.estado_vigencia] || t.estado_vigencia);
  if (t.cupo_pct != null) parts.push(`${Math.round(t.cupo_pct)} % del cupo`);
  if (t.codigo_anm) parts.push(t.codigo_anm);
  return parts.join(" · ") || null;
}

export function zoneSubtitle(z: Zone): string | null {
  return [z.estado && z.estado !== "activa" ? z.estado : null, z.poligono ? null : "sin polígono"].filter(Boolean).join(" · ") || null;
}

export interface SetupNotices {
  messages: string[];
  /** Hay un bloqueo real (título vencido), no solo un aviso. */
  blocking: boolean;
}

/** Avisos al elegir título y frente: vigencia, cupo y si el GPS está fuera del polígono. */
export function setupNotices(title: MiningTitle, zone: Zone | null, gps: Gps | null): SetupNotices {
  const messages: string[] = [];
  let blocking = false;
  if (title.estado_vigencia === "vencido") {
    blocking = true;
    messages.push(`El título ${title.nombre} está vencido: el servidor no aceptará registros de extracción sobre él.`);
  } else if (title.estado_vigencia === "por_vencer") {
    messages.push(`El título ${title.nombre} vence en ${title.dias_para_vencer} días.`);
  }
  if (title.cupo_pct != null && title.cupo_pct >= 80) {
    messages.push(`Va en ${Math.round(title.cupo_pct)} % del cupo anual autorizado.`);
  }
  if (zone?.poligono && gps && pointInPolygon(gps.lat, gps.lon, zone.poligono) === false) {
    messages.push(`El GPS de la tablet no está dentro de ${zone.nombre}.`);
  }
  return { messages, blocking };
}
