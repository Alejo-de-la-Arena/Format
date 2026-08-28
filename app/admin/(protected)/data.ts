import type { Forma } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { isIntroMotion, type IntroMotion } from "@/lib/season-intro";

/**
 * Shapes de datos para /admin — incluyen `id` (uuid de Supabase) porque acá
 * sí hace falta identificar filas para editar/borrar. La capa pública
 * (lib/data/*) no expone `id`, sólo `slug`, a propósito.
 */
export interface AdminSeason {
  id: string;
  slug: string;
  numero: string;
  nombre: string;
  forma: Forma;
  colores: string[];
  concepto: string;
  fechaInicio: string;
  fechaFin: string;
  aftermovieUrl: string | null;
  aboutRelato: string;
  colorDescripcion: string;
  formaDescripcion: string;
  introText: string;
  introMotion: IntroMotion;
  introAvailable: boolean;
  labClips: AdminLabClip[];
}

/** Un clip de FORMAT Lab en /admin. Sólo URL: no hay objeto en Storage. */
export interface AdminLabClip {
  id: string;
  orden: number;
  titulo: string;
  url: string;
}

export interface AdminLineupSlot {
  id: string;
  orden: number;
  horaInicio: string | null;
  horaFin: string | null;
  artistas: string[];
}

export interface AdminFoto {
  id: string;
  orden: number;
  storagePath: string;
  url: string;
}

export interface AdminFecha {
  id: string;
  seasonId: string;
  fecha: string;
  especial: boolean;
  horaInicio: string | null;
  horaFin: string | null;
  flyerPath: string | null;
  flyerUrl: string | null;
  fotoEscenaPath: string | null;
  fotoEscenaUrl: string | null;
  barraLibre: boolean;
  tragoNombre: string | null;
  tragoDescripcion: string | null;
  lineup: AdminLineupSlot[];
  fotos: AdminFoto[];
}

export interface AdminSeasonWithFechas extends AdminSeason {
  fechas: AdminFecha[];
}

/** Todas las Seasons con sus Fechas (lineup + galería incluidos), para el acordeón de /admin. */
export async function getAdminSeasons(): Promise<AdminSeasonWithFechas[]> {
  const supabase = await createClient();

  const { data: seasonRows, error: seasonsError } = await supabase
    .from("seasons")
    .select("*, season_lab_clips(*)")
    .order("fecha_inicio", { ascending: true })
    .order("orden", { referencedTable: "season_lab_clips", ascending: true });
  if (seasonsError) throw seasonsError;

  const { data: fechaRows, error: fechasError } = await supabase
    .from("fechas")
    .select("*, lineup_slots(*), fotos_galeria(*)")
    .order("fecha", { ascending: true })
    .order("orden", { referencedTable: "lineup_slots", ascending: true })
    .order("orden", { referencedTable: "fotos_galeria", ascending: true });
  if (fechasError) throw fechasError;

  // Cache-busting con updated_at — flyer/foto_escena se suben a un path
  // determinístico con upsert:true, así que la URL pública no cambia sola
  // al reemplazar el archivo y el CDN/next/image siguen sirviendo la
  // versión vieja cacheada sin este query param.
  const bust = (url: string | null, updatedAt: string) =>
    url ? `${url}?v=${encodeURIComponent(updatedAt)}` : url;
  const flyerUrl = (path: string | null, updatedAt: string) =>
    bust(path ? supabase.storage.from("flyers").getPublicUrl(path).data.publicUrl : null, updatedAt);
  const galeriaUrl = (path: string | null) =>
    path ? supabase.storage.from("galerias").getPublicUrl(path).data.publicUrl : null;

  const fechasBySeason = new Map<string, AdminFecha[]>();
  for (const row of fechaRows ?? []) {
    const fecha: AdminFecha = {
      id: row.id,
      seasonId: row.season_id,
      fecha: row.fecha,
      especial: row.especial,
      horaInicio: row.hora_inicio,
      horaFin: row.hora_fin,
      flyerPath: row.flyer_path,
      flyerUrl: flyerUrl(row.flyer_path, row.updated_at),
      fotoEscenaPath: row.foto_escena_path,
      fotoEscenaUrl: bust(galeriaUrl(row.foto_escena_path), row.updated_at),
      barraLibre: row.barra_libre,
      tragoNombre: row.trago_nombre,
      tragoDescripcion: row.trago_descripcion,
      lineup: (row.lineup_slots ?? [])
        .sort((a: { orden: number }, b: { orden: number }) => a.orden - b.orden)
        .map((s: { id: string; orden: number; hora_inicio: string | null; hora_fin: string | null; artistas: string[] }) => ({
          id: s.id,
          orden: s.orden,
          horaInicio: s.hora_inicio,
          horaFin: s.hora_fin,
          artistas: s.artistas,
        })),
      fotos: (row.fotos_galeria ?? [])
        .sort((a: { orden: number }, b: { orden: number }) => a.orden - b.orden)
        .map((f: { id: string; orden: number; storage_path: string }) => ({
          id: f.id,
          orden: f.orden,
          storagePath: f.storage_path,
          url: galeriaUrl(f.storage_path)!,
        })),
    };
    const list = fechasBySeason.get(row.season_id) ?? [];
    list.push(fecha);
    fechasBySeason.set(row.season_id, list);
  }

  return (seasonRows ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    numero: row.numero,
    nombre: row.nombre,
    forma: row.forma,
    colores: row.colores,
    concepto: row.concepto,
    fechaInicio: row.fecha_inicio,
    fechaFin: row.fecha_fin,
    aftermovieUrl: row.aftermovie_url,
    aboutRelato: row.about_relato ?? "",
    colorDescripcion: row.color_descripcion ?? "",
    formaDescripcion: row.forma_descripcion ?? "",
    introText: row.intro_text ?? "",
    introMotion: isIntroMotion(row.intro_motion) ? row.intro_motion : "signal",
    introAvailable: "intro_text" in row && "intro_motion" in row,
    labClips: (row.season_lab_clips ?? [])
      .sort((a: { orden: number }, b: { orden: number }) => a.orden - b.orden)
      .map((c: { id: string; orden: number; titulo: string; video_url: string }) => ({
        id: c.id,
        orden: c.orden,
        titulo: c.titulo,
        url: c.video_url,
      })),
    fechas: fechasBySeason.get(row.id) ?? [],
  }));
}
