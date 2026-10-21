import type { Stage } from "../types";

type StageDef = Omit<Stage, "x">;

/** Granulometría: del bloque a la arena muy fina. `vs` = tamaño visual en la escena 3D, `cnt` = piezas. */
const STAGE_DEFS: StageDef[] = [
  {cod:'BLO',n:'Bloque / Roca', short:'Bloque',  mm:'> 256 mm',          mm_min:256,   mm_max:null, c:'#8f8b84',vs:1.55,cnt:3,  rock:true, grain:22},
  {cod:'CAN',n:'Canto rodado',  short:'Canto',   mm:'64 – 256 mm',       mm_min:64,    mm_max:256,  c:'#9b9482',vs:0.86,cnt:8,  rock:true, grain:15},
  {cod:'GRA',n:'Grava',         short:'Grava',   mm:'4 – 64 mm',         mm_min:4,     mm_max:64,   c:'#a89a76',vs:0.50,cnt:20, rock:true, grain:10},
  {cod:'GRV',n:'Gravilla',      short:'Gravilla',mm:'2 – 4 mm',          mm_min:2,     mm_max:4,    c:'#b6a46a',vs:0.26,cnt:55, rock:true, grain:6.5},
  {cod:'ARG',n:'Arena gruesa',  short:'Gruesa',  mm:'0.5 – 2 mm',        mm_min:0.5,   mm_max:2,    c:'#c6ab60',vs:0.155,cnt:150,rock:false,grain:4.5},
  {cod:'ARM',n:'Arena media',   short:'Media',   mm:'0.25 – 0.5 mm',     mm_min:0.25,  mm_max:0.5,  c:'#d4b86a',vs:0.10, cnt:280,rock:false,grain:3},
  {cod:'ARF',n:'Arena fina',    short:'Fina',    mm:'0.125 – 0.25 mm',   mm_min:0.125, mm_max:0.25, c:'#e0c67e',vs:0.062,cnt:430,rock:false,grain:2},
  {cod:'ARX',n:'Arena muy fina',short:'Muy fina',mm:'0.0625 – 0.125 mm', mm_min:0.0625,mm_max:0.125,c:'#ecd8a0',vs:0.040,cnt:600,rock:false,grain:1.4},
];

const GAP = 1.7;
const SPREAD = 1.05;
const CENTER_OFFSET = 0.4;

/** Posición de cada material en la fila 3D: el espacio entre dos depende del tamaño de ambos. */
function withLayout(defs: StageDef[]): Stage[] {
  const raw: number[] = [0];
  for (let i = 1; i < defs.length; i++) {
    raw[i] = raw[i - 1] + GAP + SPREAD * (defs[i - 1].vs + defs[i].vs);
  }
  const mid = raw[raw.length - 1] / 2;
  return defs.map((d, i) => ({ ...d, x: raw[i] - mid - CENTER_OFFSET }));
}

export const STAGES: Stage[] = withLayout(STAGE_DEFS);
