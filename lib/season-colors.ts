import type { Season } from "@/lib/types";

/**
 * Los 5 colores de la Season en orden de rol, completando los faltantes con
 * el principal (regla del CLAUDE.md § Colores por Season).
 *
 * Vive en su propio módulo (sin importar Supabase) porque lo consumen
 * componentes cliente (Hero, ArchiveCard, PosterCard) — si estuviera en
 * lib/data/seasons.ts arrastraría `next/headers` al bundle de cliente.
 */
export function getSeasonColors(
  season: Season,
): [string, string, string, string, string] {
  const principal = season.colores[0];
  return [0, 1, 2, 3, 4].map(
    (i) => season.colores[i] ?? principal,
  ) as [string, string, string, string, string];
}
