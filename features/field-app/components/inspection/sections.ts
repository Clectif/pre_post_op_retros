import { SECTIONS } from "../../data/inspection-sections";
import type { SectionDef } from "../../types";

export const SECTIONS_BY_ID: Record<string, SectionDef | undefined> = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));
