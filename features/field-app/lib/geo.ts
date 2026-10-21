import type { GeoPolygon } from "../types";

type Ring = [number, number][];

/** Ray casting. El anillo viene en orden GeoJSON: [lon, lat]. */
function inRing(lat: number, lon: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, n = ring.length; i < n; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % n];
    if (y1 > lat !== y2 > lat) {
      const cut = x1 + ((lat - y1) * (x2 - x1)) / (y2 - y1);
      if (lon < cut) inside = !inside;
    }
  }
  return inside;
}

/**
 * Mismo cálculo que hace el backend, para poder avisar antes de enviar.
 * true/false si se puede decidir; null si falta el GPS o el polígono.
 * El primer anillo es el contorno y los siguientes son huecos.
 */
export function pointInPolygon(
  lat: number | null | undefined,
  lon: number | null | undefined,
  geo: GeoPolygon | null | undefined,
): boolean | null {
  if (lat == null || lon == null || !geo || !geo.coordinates) return null;
  const type = (geo.type || "").toLowerCase();
  const coords = geo.coordinates as Ring[][] | Ring[];
  const polygons: Ring[][] =
    type === "multipolygon" ? (coords as Ring[][]) : type === "polygon" ? [coords as Ring[]] : [];
  if (!polygons.length) return null;

  for (const poly of polygons) {
    const rings = poly.filter((r) => Array.isArray(r) && r.length >= 4);
    if (!rings.length) continue;
    if (inRing(lat, lon, rings[0]) && !rings.slice(1).some((hole) => inRing(lat, lon, hole))) return true;
  }
  return false;
}
