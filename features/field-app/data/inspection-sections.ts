import type { SectionDef } from "../types";

/** Secciones de la inspección. `part` indica qué parte de la máquina 3D se resalta. */
export const SECTIONS: SectionDef[] = [
  {id:"LEC", ic:"⛽", nombre:"Lecturas",             desc:"Antes de empezar (F-PR-01 1.1–1.5): máquina en superficie plana y estable, apagada, con freno de parqueo puesto, sin carga y con el área despejada.", fase:"ambos", part:"cab"},
  {id:"MOT", ic:"🛢", nombre:"Motor y fluidos",      desc:"Niveles, fugas, filtros y batería. Revisión con la máquina apagada y en terreno nivelado.", fase:"pre", part:"house"},
  {id:"HID", ic:"💪", nombre:"Hidráulico y frente",  desc:"Mangueras, cilindros, pines, balde y acople rápido. Incluye prueba de recorrido y deriva.", fase:"pre", part:"front"},
  {id:"ROD", ic:"⚙️", nombre:"Tren de rodaje",       desc:"Cadenas, rodillos y sprocket (oruga) o llantas y rines (llantas).", fase:"pre", part:"under"},
  {id:"FRE", ic:"🛑", nombre:"Frenos y traslado",    desc:"Frenos de servicio y parqueo, dirección y respuesta de traslado.", fase:"pre", part:"under"},
  {id:"CAB", ic:"🪟", nombre:"Cabina e instrumentos",desc:"Tablero, indicadores, visibilidad y limpieza del puesto de mando.", fase:"pre", part:"cab"},
  {id:"SEG", ic:"🦺", nombre:"Seguridad",            desc:"Cinturón, alarma, extintor, ROPS/FOPS y parada de emergencia. Aquí están los bloqueos duros.", fase:"pre", part:"cab"},
  {id:"DOC", ic:"📋", nombre:"Documentos",           desc:"Licencia del operador, hoja de vida de la máquina y permisos de trabajo.", fase:"pre", part:null},
  {id:"ENT", ic:"⛰", nombre:"Entorno del frente",    desc:"Terreno, redes aéreas y subterráneas, aislamiento y comunicación.", fase:"pre", part:"ground"},
  {id:"CIE", ic:"🌙", nombre:"Cierre de turno",      desc:"Parqueo seguro, bloqueo de mandos, fugas nuevas y novedades del turno.", fase:"post", part:"house"},
];
