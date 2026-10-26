import { useEffect, useState } from "react";
import type { Gps } from "../types";

export interface Geolocation {
  /** Última posición conocida de la tablet, o null mientras no haya señal. */
  gps: Gps | null;
  /** Por qué no hay posición, en palabras para el operario; null si hay posición o aún se está buscando. */
  issue: string | null;
}

/** Sin posición, la inspección sale sin ubicación y no aparece en el mapa: el motivo se muestra antes de firmar. */
const ISSUES: Record<number, string> = {
  1: "Telegram no tiene permiso de ubicación. Actívelo en Ajustes → Aplicaciones → Telegram → Permisos → Ubicación.",
  2: "La tablet no logra ubicarse. Revise que la ubicación (GPS) esté encendida.",
  3: "Sin señal de GPS por ahora. Si está bajo techo, salga a cielo abierto.",
};

export function useGeolocation(): Geolocation {
  const [gps, setGps] = useState<Gps | null>(null);
  // la app solo corre en el cliente (FieldAppLoader, ssr: false): navigator existe aquí
  const [issue, setIssue] = useState<string | null>(() =>
    navigator.geolocation ? null : "Este dispositivo no ofrece ubicación.",
  );

  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setGps({
          lat: +p.coords.latitude.toFixed(6),
          lon: +p.coords.longitude.toFixed(6),
          precision: Math.round(p.coords.accuracy),
        });
        setIssue(null);
      },
      // se conserva la última posición buena: un timeout pasajero no la borra
      (e) => setIssue(ISSUES[e.code] ?? "No se pudo obtener la ubicación."),
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return { gps, issue };
}
