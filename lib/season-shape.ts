import type { Forma } from "@/lib/types";

const FORMAS: Forma[] = [
  "square", "circle", "double-circle", "triangle", "hexagon",
  "hexagon-organic", "infinity", "cross",
];

/** Older clients and future database shapes always have a drawable fallback. */
export function normalizeForma(value: unknown): Forma {
  return FORMAS.includes(value as Forma) ? value as Forma : "square";
}
