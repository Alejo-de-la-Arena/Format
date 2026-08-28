import { cache } from "react";
import type { LabClip, Season } from "@/lib/types";
import { createClient } from "@/lib/supabase/public";
import { isIntroMotion, buenosAiresDay } from "@/lib/season-intro";

export { getSeasonColors } from "@/lib/season-colors";

interface SeasonRow {
  slug: string;
  numero: string;
  nombre: string;
  forma: Season["forma"];
  colores: string[];
  concepto: string;
  fecha_inicio: string;
  fecha_fin: string;
  aftermovie_url: string | null;
  about_relato: string | null;
  color_descripcion: string | null;
  forma_descripcion: string | null;
  intro_text?: string | null;
  intro_motion?: string | null;
  season_lab_clips: { orden: number; titulo: string; video_url: string }[];
}

function mapSeason(row: SeasonRow): Season {
  const labClips: LabClip[] = [...(row.season_lab_clips ?? [])]
    .sort((a, b) => a.orden - b.orden)
    .map((c) => ({ titulo: c.titulo, url: c.video_url, orden: c.orden }));

  return {
    slug: row.slug,
    numero: row.numero,
    nombre: row.nombre,
    forma: row.forma,
    colores: row.colores,
    concepto: row.concepto,
    fechaInicio: row.fecha_inicio,
    fechaFin: row.fecha_fin,
    aftermovieUrl: row.aftermovie_url ?? undefined,
    labClips,
    intro: {
      text: row.intro_text ?? "",
      motion: isIntroMotion(row.intro_motion) ? row.intro_motion : "signal",
    },
    about: {
      relato: row.about_relato ?? "",
      colorDescripcion: row.color_descripcion ?? "",
      formaDescripcion: row.forma_descripcion ?? "",
    },
  };
}

/**
 * Todas las Seasons, en orden cronológico. Memoizado por request.
 * Si Supabase no está configurado/alcanzable (ej. build sin .env, o una
 * caída puntual), degrada a `[]` en vez de tirar abajo el sitio entero —
 * ver getActiveSeason/seasonAccentVars para el fallback visual.
 */
export const getSeasons = cache(async (): Promise<Season[]> => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("seasons")
      .select("*, season_lab_clips(*)")
      .order("fecha_inicio", { ascending: true })
      .order("orden", { referencedTable: "season_lab_clips", ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapSeason);
  } catch (err) {
    console.error("getSeasons: no se pudo consultar Supabase", err);
    return [];
  }
});

/** Una Season por slug, o null si no existe. */
export async function getSeason(slug: string): Promise<Season | null> {
  const seasons = await getSeasons();
  return seasons.find((s) => s.slug === slug) ?? null;
}

/**
 * La Season activa: la que contiene la fecha de hoy; si estamos entre dos,
 * la próxima; si todas pasaron, la última. null si todavía no hay ninguna
 * Season cargada (base recién creada).
 */
export async function getActiveSeason(): Promise<Season | null> {
  const seasons = await getSeasons();
  if (seasons.length === 0) return null;

  const hoy = buenosAiresDay();

  const enCurso = seasons.find(
    (s) =>
      hoy >= s.fechaInicio && hoy <= s.fechaFin,
  );
  if (enCurso) return enCurso;

  const proxima = seasons.find(
    (s) => s.fechaInicio > hoy,
  );
  if (proxima) return proxima;

  return seasons[seasons.length - 1];
}

/** Color principal de todas las Seasons salvo la indicada, en orden cronológico. */
export async function getAccentsExcept(slug: string): Promise<string[]> {
  const seasons = await getSeasons();
  return seasons.filter((s) => s.slug !== slug).map((s) => s.colores[0]);
}
