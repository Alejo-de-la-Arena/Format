import type { Fecha, Season } from "@/lib/types";
import { PULSE, PULSE_FECHAS } from "@/lib/season-pulse";
import { JUNGLE, JUNGLE_FECHAS } from "@/lib/season-jungle";

/** Seasons que se pueden previsualizar con NEXT_PUBLIC_SEASON_OVERRIDE=<slug> antes de cargarlas en Supabase. */
const PREVIEWS: Record<string, { season: Season; fechas: Fecha[] }> = {
  [PULSE.slug]: { season: PULSE, fechas: PULSE_FECHAS },
  [JUNGLE.slug]: { season: JUNGLE, fechas: JUNGLE_FECHAS },
};

/** Opt-in para builds locales y previews de Vercel; nunca en producción. */
export function getDevPreview(): { season: Season; fechas: Fecha[] } | null {
  const slug = process.env.NEXT_PUBLIC_SEASON_OVERRIDE;
  if (process.env.VERCEL_ENV === "production" || !slug || !Object.hasOwn(PREVIEWS, slug)) return null;
  return PREVIEWS[slug];
}

export function getDevSeasonOverride(): Season | null {
  return getDevPreview()?.season ?? null;
}
