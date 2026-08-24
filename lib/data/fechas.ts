import { cache } from "react";
import type { Fecha, LineupSlot } from "@/lib/types";
import { createClient } from "@/lib/supabase/public";
import { esPasado } from "@/lib/dates";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

interface FechaRow {
  fecha: string;
  especial: boolean;
  hora_inicio: string | null;
  hora_fin: string | null;
  flyer_path: string | null;
  foto_escena_path: string | null;
  updated_at: string;
  youtube_url: string | null;
  soundcloud_url: string | null;
  barra_libre: boolean;
  trago_nombre: string | null;
  trago_descripcion: string | null;
  seasons: { slug: string } | null;
  lineup_slots: {
    orden: number;
    hora_inicio: string | null;
    hora_fin: string | null;
    artistas: string[];
  }[];
  fotos_galeria: { orden: number; storage_path: string }[];
}

/**
 * URL pública de un objeto de Storage, con cache-busting vía `?v=`. Los
 * paths de flyer/fotoEscena son determinísticos ({seasonSlug}/{fecha}.webp)
 * y se suben con upsert:true, así que la URL no cambia al reemplazar un
 * archivo — sin este query param, el CDN de Supabase y el optimizador de
 * next/image siguen sirviendo la versión vieja cacheada. `updatedAt` viene
 * de la columna `updated_at` de la fila (se actualiza sola vía trigger).
 */
function publicUrl(
  supabase: SupabaseClient,
  bucket: "flyers" | "galerias",
  path: string | null,
  updatedAt?: string,
): string | undefined {
  if (!path) return undefined;
  const url = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  return updatedAt ? `${url}?v=${encodeURIComponent(updatedAt)}` : url;
}

function mapFecha(supabase: SupabaseClient, row: FechaRow): Fecha {
  const lineup: LineupSlot[] = [...(row.lineup_slots ?? [])]
    .sort((a, b) => a.orden - b.orden)
    .map((s) => ({
      orden: s.orden,
      horaInicio: s.hora_inicio ?? undefined,
      horaFin: s.hora_fin ?? undefined,
      artistas: s.artistas,
    }));

  const galeria = [...(row.fotos_galeria ?? [])]
    .sort((a, b) => a.orden - b.orden)
    .map((f) => publicUrl(supabase, "galerias", f.storage_path))
    .filter((url): url is string => Boolean(url));

  return {
    seasonSlug: row.seasons?.slug ?? "",
    fecha: row.fecha,
    especial: row.especial,
    horaInicio: row.hora_inicio ?? undefined,
    horaFin: row.hora_fin ?? undefined,
    lineup: lineup.length > 0 ? lineup : undefined,
    flyer: publicUrl(supabase, "flyers", row.flyer_path, row.updated_at),
    fotoEscena: publicUrl(supabase, "galerias", row.foto_escena_path, row.updated_at),
    galeria: galeria.length > 0 ? galeria : undefined,
    youtube: row.youtube_url ?? undefined,
    soundcloud: row.soundcloud_url ?? undefined,
    barraLibre: row.especial ? row.barra_libre : undefined,
    tragoAutor:
      row.especial && row.trago_nombre
        ? { nombre: row.trago_nombre, descripcion: row.trago_descripcion ?? "" }
        : undefined,
  };
}

/**
 * Todos los viernes, sin ordenar todavía. Memoizado por request. Degrada a
 * `[]` si Supabase no está configurado/alcanzable — ver getSeasons.
 */
const getAllFechas = cache(async (): Promise<Fecha[]> => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("fechas")
      .select("*, seasons(slug), lineup_slots(*), fotos_galeria(*)")
      .order("orden", { referencedTable: "lineup_slots", ascending: true })
      .order("orden", { referencedTable: "fotos_galeria", ascending: true });
    if (error) throw error;
    return (data ?? []).map((row) => mapFecha(supabase, row as unknown as FechaRow));
  } catch (err) {
    console.error("getAllFechas: no se pudo consultar Supabase", err);
    return [];
  }
});

/** Los viernes en orden cronológico ascendente. */
export async function getFechasOrdenadas(): Promise<Fecha[]> {
  const fechas = await getAllFechas();
  return [...fechas].sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/** Viernes de una Season, en orden cronológico. */
export async function getFechasBySeason(seasonSlug: string): Promise<Fecha[]> {
  const fechas = await getFechasOrdenadas();
  return fechas.filter((f) => f.seasonSlug === seasonSlug);
}

/** Próximos viernes (hoy inclusive), orden ascendente. */
export async function getFechasProximas(): Promise<Fecha[]> {
  const fechas = await getFechasOrdenadas();
  return fechas.filter((f) => !esPasado(f.fecha));
}

/** Próximos viernes con flyer cargado — para sliders tipo poster (home, Experience). */
export async function getFechasProximasConFlyer(): Promise<Fecha[]> {
  const fechas = await getFechasProximas();
  return fechas.filter((f) => f.flyer);
}

/** Viernes ya pasados, el más reciente primero. */
export async function getFechasPasadas(): Promise<Fecha[]> {
  const fechas = await getFechasOrdenadas();
  return fechas.filter((f) => esPasado(f.fecha)).reverse();
}

/** El próximo viernes (o undefined si no quedan próximos). */
export async function getProximaFecha(): Promise<Fecha | undefined> {
  const proximas = await getFechasProximas();
  return proximas[0];
}

/** Viernes de apertura (especial=true), pasados y próximos. */
export async function getFechasEspeciales(): Promise<Fecha[]> {
  const fechas = await getFechasOrdenadas();
  return fechas.filter((f) => f.especial);
}

/** El próximo viernes Experience (especial=true), si queda alguno. */
export async function getProximaFechaEspecial(): Promise<Fecha | undefined> {
  const especiales = await getFechasEspeciales();
  return especiales.find((f) => !esPasado(f.fecha));
}
