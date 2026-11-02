import type { Forma } from "@/lib/types";

const FORMAS: Forma[] = [
  "square", "circle", "double-circle", "double-diamond", "triangle", "hexagon",
  "hexagon-organic", "infinity", "cross",
];

/** Formas de doble línea (Pulse, Jungle): se dibujan como contorno, no como
 * sticker relleno, y piden tinta debajo del logo/flecha. */
const DOUBLE_LINE: Forma[] = ["double-circle", "double-diamond"];

export function isDoubleLine(forma: Forma): boolean {
  return DOUBLE_LINE.includes(forma);
}

export function isForma(value: unknown): value is Forma {
  return FORMAS.includes(value as Forma);
}

/** Older clients and future database shapes always have a drawable fallback. */
export function normalizeForma(value: unknown): Forma {
  return FORMAS.includes(value as Forma) ? value as Forma : "square";
}
