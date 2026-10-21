import { useCallback, useEffect, useState } from "react";
import { CATALOG_REFRESH_MS } from "../config";
import { SEED_CATALOG } from "../data/seed";
import { fetchContext } from "../lib/api";
import { readContextCache, writeContextCache } from "../lib/storage/meta";
import type { Catalog, CatalogOrigin, ContextPayload } from "../types";

function applyPayload(prev: Catalog, d: ContextPayload, ts: string, origen: CatalogOrigin): Catalog {
  return {
    maquinas: d.maquinas?.length ? d.maquinas : prev.maquinas,
    titulos: d.titulos ? (d.titulos.length ? d.titulos : SEED_CATALOG.titulos) : prev.titulos,
    zonas: d.zonas ?? [],
    turnos: d.turnos?.length ? d.turnos : prev.turnos,
    zonasOperativas:
      d.zonas_operativas && Object.keys(d.zonas_operativas).length ? d.zonas_operativas : prev.zonasOperativas,
    hash: d.hash ?? null,
    ts,
    origen,
  };
}

/**
 * Catálogo de máquinas, títulos, frentes y turnos.
 * `load()` aplica primero la copia local y después pregunta al servidor; si el hash
 * coincide no repinta. Devuelve el catálogo vigente tras la carga.
 */
export function useCatalog(initData: string) {
  const [catalog, setCatalog] = useState<Catalog>(SEED_CATALOG);

  const load = useCallback(async (): Promise<Catalog> => {
    let current = SEED_CATALOG;
    const cache = await readContextCache();
    if (cache) {
      current = applyPayload(current, cache.datos, cache.ts, "caché");
      setCatalog(current);
    }
    const remote = await fetchContext(initData);
    if (!remote) return current;
    if (cache?.datos.hash && cache.datos.hash === remote.hash) {
      current = { ...current, origen: "caché al día" };
      setCatalog(current);
      return current;
    }
    await writeContextCache(remote);
    current = applyPayload(current, remote, new Date().toISOString(), "servidor");
    setCatalog(current);
    return current;
  }, [initData]);

  // refresco periódico: una tablet puede pasar el turno entero con la app abierta
  useEffect(() => {
    const id = setInterval(() => void load(), CATALOG_REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  return { catalog, load };
}
