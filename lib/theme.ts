import type { CSSProperties } from "react";
import type { Season } from "@/lib/types";
import { getSeasonColors } from "@/lib/season-colors";

/**
 * Los 5 colores de una Season como custom properties CSS (--accent-1..5).
 * Aplicado en <body> para la Season activa, o en un wrapper propio en
 * /eventos/[slug] para sobreescribir por herencia sólo esa subárbol.
 * `season = null` (todavía no hay ninguna Season cargada): fallback neutro
 * a --color-ink, sin acento.
 */
export function seasonAccentVars(season: Season | null): CSSProperties {
  if (!season) {
    return {
      "--accent-1": "var(--color-ink)",
      "--accent-2": "var(--color-ink)",
      "--accent-3": "var(--color-ink)",
      "--accent-4": "var(--color-ink)",
      "--accent-5": "var(--color-ink)",
    } as CSSProperties;
  }
  const [c1, c2, c3, c4, c5] = getSeasonColors(season);
  return {
    "--accent-1": c1,
    "--accent-2": c2,
    "--accent-3": c3,
    "--accent-4": c4,
    "--accent-5": c5,
  } as CSSProperties;
}
