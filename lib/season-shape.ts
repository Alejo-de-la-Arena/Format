import type { Forma } from "@/lib/types";
import type { IntroMotion } from "@/lib/season-intro";

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

/**
 * Qué entrada usa una Season: "grow" (Jungle: lianas y hojas), "line" (formas
 * de doble línea, como Pulse: el contorno se dibuja y golpea) o null (la
 * intro de ensamblado de las Seasons anteriores).
 */
export type ShapeIntroVariant = "line" | "grow";
export function shapeIntroVariant({ forma, motion }: { forma: Forma; motion: IntroMotion }): ShapeIntroVariant | null {
  if (motion === "grow") return "grow";
  return isDoubleLine(forma) ? "line" : null;
}
