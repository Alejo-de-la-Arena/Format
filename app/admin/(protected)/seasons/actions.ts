"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseVideoUrl } from "@/lib/embed";
import type { Forma } from "@/lib/types";
import { isIntroMotion, isIntroText } from "@/lib/season-intro";

export type SeasonFormState =
  | { error?: string; ok?: boolean; slug?: string }
  | undefined;

function revalidateSite(slug?: string) {
  revalidatePath("/");
  revalidatePath("/fechas");
  revalidatePath("/proximas-fechas");
  revalidatePath("/calendario");
  revalidatePath("/archivo");
  revalidatePath("/about");
  revalidatePath("/experience");
  if (slug) revalidatePath(`/eventos/${slug}`);
  revalidatePath("/admin");
}

async function assertExperienceFecha(fechaId: string) {
  const supabase = await createClient();
  const { data: fecha, error } = await supabase
    .from("fechas")
    .select("especial")
    .eq("id", fechaId)
    .single();
  if (error || !fecha?.especial) {
    throw new Error("Los clips sólo se pueden cargar en una fecha Experience.");
  }
  return supabase;
}

export async function upsertSeason(
  _prevState: SeasonFormState,
  formData: FormData,
): Promise<SeasonFormState> {
  const id = String(formData.get("id") ?? "").trim() || null;
  const slug = String(formData.get("slug") ?? "").trim();
  const numero = String(formData.get("numero") ?? "").trim();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const forma = String(formData.get("forma") ?? "") as Forma;
  const concepto = String(formData.get("concepto") ?? "").trim();
  const fechaInicio = String(formData.get("fechaInicio") ?? "");
  const fechaFin = String(formData.get("fechaFin") ?? "");
  const aftermovieUrl = String(formData.get("aftermovieUrl") ?? "").trim();
  // Bloques de texto de /about — texto libre con saltos de línea, sin trim
  // interno (sólo bordes) para no comerse la última línea vacía intencional.
  const aboutRelato = String(formData.get("aboutRelato") ?? "").trim();
  const colorDescripcion = String(formData.get("colorDescripcion") ?? "").trim();
  const formaDescripcion = String(formData.get("formaDescripcion") ?? "").trim();
  const introText = String(formData.get("introText") ?? "").trim();
  const introMotion = String(formData.get("introMotion") ?? "signal");
  if (!isIntroText(introText) || !isIntroMotion(introMotion)) {
    return { error: "La bienvenida admite hasta 160 caracteres, 3 líneas y un movimiento de la lista." };
  }
  const colores = formData
    .getAll("colores")
    .map((v) => String(v).trim())
    .filter(Boolean)
    .slice(0, 5);

  if (!slug || !numero || !nombre || !forma || !fechaInicio || !fechaFin) {
    return { error: "Completá todos los campos obligatorios." };
  }
  if (fechaFin < fechaInicio) {
    return { error: "La fecha de fin no puede ser anterior a la de inicio." };
  }
  // Se valida acá y no sólo en el input para que lo que queda guardado sea
  // siempre embebible: el player parsea con la misma función (lib/embed.ts).
  const aftermovieEmbed = aftermovieUrl ? parseVideoUrl(aftermovieUrl) : null;
  if (aftermovieUrl && !aftermovieEmbed) {
    return {
      error:
        "El aftermovie tiene que ser una URL o iframe válido de YouTube o Vimeo.",
    };
  }

  const supabase = await createClient();
  const payload = {
    slug,
    numero,
    nombre,
    forma,
    concepto,
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
    colores,
    aftermovie_url: aftermovieEmbed?.normalizedUrl ?? null,
    about_relato: aboutRelato,
    color_descripcion: colorDescripcion,
    forma_descripcion: formaDescripcion,
    // Disabled fields are omitted before migration, preserving other edits.
    ...(formData.has("introMotion") ? { intro_text: introText, intro_motion: introMotion } : {}),
  };

  const { error } = id
    ? await supabase.from("seasons").update(payload).eq("id", id)
    : await supabase.from("seasons").insert(payload);

  if (error) {
    if (/intro_(text|motion)/.test(error.message)) {
      return { error: "Aplicá primero la migración 0010_season_intro.sql y recargá el panel." };
    }
    return { error: error.message };
  }

  revalidateSite(slug);
  return { ok: true, slug };
}

export async function deleteSeason(id: string, slug: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("seasons").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateSite(slug);
}

/**
 * FORMAT LAB — clips por URL de una fecha Experience. No hay objetos en
 * Storage: borrar un clip es borrar la fila y nada más.
 */
export async function upsertLabClip(
  fechaId: string,
  slug: string,
  clip: { id?: string; titulo: string; url: string; orden: number },
): Promise<{ id: string }> {
  const titulo = clip.titulo.trim();
  const url = clip.url.trim();
  if (!url) throw new Error("Falta la URL del clip.");
  const embed = parseVideoUrl(url);
  if (!embed) {
    throw new Error("Pegá una URL o iframe válido de YouTube o Vimeo.");
  }

  const supabase = await assertExperienceFecha(fechaId);

  const payload = {
    fecha_id: fechaId,
    titulo,
    video_url: embed.normalizedUrl,
    orden: clip.orden,
  };

  if (clip.id) {
    const { error } = await supabase
      .from("season_lab_clips")
      .update(payload)
      .eq("id", clip.id)
      .eq("fecha_id", fechaId);
    if (error) throw new Error(error.message);
    revalidateSite(slug);
    return { id: clip.id };
  }

  const { data, error } = await supabase
    .from("season_lab_clips")
    .insert(payload)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidateSite(slug);
  return { id: data.id };
}

export async function deleteLabClip(id: string, fechaId: string, slug: string) {
  const supabase = await assertExperienceFecha(fechaId);
  const { data, error } = await supabase
    .from("season_lab_clips")
    .delete()
    .eq("id", id)
    .eq("fecha_id", fechaId)
    .select("id");
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error("No se pudo borrar el clip: sin permisos o ya no existe.");
  }
  revalidateSite(slug);
}

/** `orden` no tiene unique, así que alcanza con un update por fila. */
export async function reorderLabClips(
  clips: { id: string; orden: number }[],
  fechaId: string,
  slug: string,
) {
  const supabase = await assertExperienceFecha(fechaId);
  const results = await Promise.all(
    clips.map((c) =>
      supabase
        .from("season_lab_clips")
        .update({ orden: c.orden })
        .eq("id", c.id)
        .eq("fecha_id", fechaId),
    ),
  );
  const error = results.find((result) => result.error)?.error;
  if (error) throw new Error(error.message);
  revalidateSite(slug);
}

/** Guarda únicamente la portada; el formulario general no puede pisarla. */
export async function attachAftermoviePoster(seasonId: string, path: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.app_metadata?.role !== "admin") throw new Error("Sin permisos para guardar la portada.");
  if (!/^[0-9a-f-]{36}$/.test(seasonId) || !new RegExp(`^${seasonId}/aftermovie-[0-9a-f-]{36}\\.webp$`).test(path)) {
    throw new Error("La portada no corresponde a esta Season.");
  }
  const { data: season, error: readError } = await supabase.from("seasons")
    .select("slug, aftermovie_poster_path").eq("id", seasonId).single();
  if (readError || !season) throw new Error("No se pudo leer la Season. Verificá que la carga de portadas esté habilitada.");
  const { data: object, error: objectError } = await supabase.storage.from("season-previews").info(path);
  if (objectError || (object?.contentType ?? object?.metadata?.mimetype) !== "image/webp") throw new Error("La imagen WebP no se subió correctamente.");
  const { data, error } = await supabase.from("seasons").update({ aftermovie_poster_path: path })
    .eq("id", seasonId).select("id").single();
  if (error || !data) throw new Error("No se pudo guardar la portada.");
  revalidateSite(season.slug);
}
