import type { ReadingDef } from "../types";

export const READINGS: ReadingDef[] = [
  {k:"horometro",             fase:"pre",  req:true,  lbl:"Horómetro inicial",     u:"h",   dec:1, hint:"Debe ser mayor o igual al último cierre."},
  {k:"combustible_pct",       fase:"pre",  req:true,  lbl:"Combustible inicial",   u:"%",   dec:0, max:100},
  {k:"odometro_km",           fase:"pre",  req:false, lbl:"Odómetro",              u:"km",  dec:0, ch:"llantas"},
  {k:"horometro_final",       fase:"post", req:true,  lbl:"Horómetro final",       u:"h",   dec:1, hint:"Mayor o igual al horómetro inicial del turno."},
  {k:"combustible_pct_final", fase:"post", req:true,  lbl:"Combustible final",     u:"%",   dec:0, max:100},
  {k:"combustible_tanqueado", fase:"post", req:false, lbl:"Combustible tanqueado", u:"gal", dec:1},
  {k:"m3_movidos",            fase:"post", req:false, lbl:"Material movido",       u:"m³",  dec:0},
  {k:"horas_parada",          fase:"post", req:false, lbl:"Horas de parada",       u:"h",   dec:1, hint:"Si es mayor que 0, describa el motivo en observaciones."},
];
