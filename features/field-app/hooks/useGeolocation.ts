import { useEffect, useState } from "react";
import type { Gps } from "../types";

/** Última posición conocida de la tablet, o null mientras no haya señal. */
export function useGeolocation(): Gps | null {
  const [gps, setGps] = useState<Gps | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (p) =>
        setGps({
          lat: +p.coords.latitude.toFixed(6),
          lon: +p.coords.longitude.toFixed(6),
          precision: Math.round(p.coords.accuracy),
        }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return gps;
}
