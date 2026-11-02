"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { adminAction } from "@/lib/auth/admin-action";
import {
  actionError,
  affectedNone,
  NO_ROWS,
  runUpdates,
  type ActionResult,
} from "@/lib/admin/action-result";
import { parseVideoUrl } from "@/lib/embed";
import { isIntroMotion, isIntroText } from "@/lib/season-intro";
import { isForma } from "@/lib/season-shape";

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

/** Devuelve un mensaje de error si la fecha no es Experience, o null. */
async function experienceFechaError(supabase: SupabaseClient, fechaId: string) {
  const { data: fecha, error } = await supabase
    .from("fechas")
    .select("especial")
    .eq("id", fechaId)
    .single();
  if (error || !fecha?.especial) {
    return "Los clips sólo se pueden cargar en una fecha Experience.";
  }
  return null;
}

export const upsertSeason = adminAction(async (
  { supabase },
  _prevState: SeasonFormState,
  formData: FormData,
): Promise<SeasonFormState> => {
  const id = String(formData.get("id") ?? "").trim() || null;
  const slug = String(formData.get("slug") ?? "").trim();
  const numero = String(formData.get("numero") ?? "").trim();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const forma = String(formData.get("forma") ?? "");
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
  if (!isForma(forma)) {
    return { error: "Elegí una forma de la lista." };
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

  const { data, error } = id
    ? await supabase.from("seasons").update(payload).eq("id", id).select("id")
    : await supabase.from("seasons").insert(payload).select("id");

  if (error) {
    if (/intro_(text|motion)/.test(error.message)) {
      return { error: "Aplicá primero la migración 0010_season_intro.sql y recargá el panel." };
    }
    return { error: error.message };
  }
  if (affectedNone(data)) return { error: NO_ROWS };

  revalidateSite(slug);
  return { ok: true, slug };
});

export const deleteSeason = adminAction(async ({ supabase }, id: string, slug: string): Promise<ActionResult> => {
  const { data, error } = await supabase.from("seasons").delete().eq("id", id).select("id");
  if (error) return actionError(error.message);
  if (affectedNone(data)) return actionError(NO_ROWS);
  revalidateSite(slug);
  return { ok: true };
});

/**
 * FORMAT LAB — clips por URL de una fecha Experience. No hay objetos en
 * Storage: borrar un clip es borrar la fila y nada más.
 */
export const upsertLabClip = adminAction(async (
  { supabase },
  fechaId: string,
  slug: string,
  clip: { id?: string; titulo: string; url: string; orden: number },
): Promise<ActionResult<{ id: string }>> => {
  const titulo = clip.titulo.trim();
  const url = clip.url.trim();
  if (!url) return actionError("Falta la URL del clip.");
  const embed = parseVideoUrl(url);
  if (!embed) {
    return actionError("Pegá una URL o iframe válido de YouTube o Vimeo.");
  }

  const fechaError = await experienceFechaError(supabase, fechaId);
  if (fechaError) return actionError(fechaError);

  const payload = {
    fecha_id: fechaId,
    titulo,
    video_url: embed.normalizedUrl,
    orden: clip.orden,
  };

  if (clip.id) {
    const { data, error } = await supabase
      .from("season_lab_clips")
      .update(payload)
      .eq("id", clip.id)
      .eq("fecha_id", fechaId)
      .select("id");
    if (error) return actionError(error.message);
    if (affectedNone(data)) return actionError(NO_ROWS);
    revalidateSite(slug);
    return { ok: true, id: clip.id };
  }

  const { data, error } = await supabase
    .from("season_lab_clips")
    .insert(payload)
    .select("id")
    .single();
  if (error) return actionError(error.message);
  revalidateSite(slug);
  return { ok: true, id: data.id };
});

export const deleteLabClip = adminAction(async (
  { supabase },
  id: string,
  fechaId: string,
  slug: string,
): Promise<ActionResult> => {
  const fechaError = await experienceFechaError(supabase, fechaId);
  if (fechaError) return actionError(fechaError);
  const { data, error } = await supabase
    .from("season_lab_clips")
    .delete()
    .eq("id", id)
    .eq("fecha_id", fechaId)
    .select("id");
  if (error) return actionError(error.message);
  if (affectedNone(data)) {
    return actionError("No se pudo borrar el clip: sin permisos o ya no existe.");
  }
  revalidateSite(slug);
  return { ok: true };
});

/** `orden` no tiene unique, así que alcanza con un update por fila. */
export const reorderLabClips = adminAction(async (
  { supabase },
  clips: { id: string; orden: number }[],
  fechaId: string,
  slug: string,
): Promise<ActionResult> => {
  const fechaError = await experienceFechaError(supabase, fechaId);
  if (fechaError) return actionError(fechaError);
  const error = await runUpdates(
    clips.map((c) =>
      supabase
        .from("season_lab_clips")
        .update({ orden: c.orden })
        .eq("id", c.id)
        .eq("fecha_id", fechaId)
        .select("id"),
    ),
  );
  if (error) return actionError(error);
  revalidateSite(slug);
  return { ok: true };
});

/** Guarda únicamente la portada; el formulario general no puede pisarla. */
export const attachAftermoviePoster = adminAction(async ({ supabase }, seasonId: string, path: string): Promise<ActionResult> => {
  if (!/^[0-9a-f-]{36}$/.test(seasonId) || !new RegExp(`^${seasonId}/aftermovie-[0-9a-f-]{36}\\.webp$`).test(path)) {
    return actionError("La portada no corresponde a esta Season.");
  }
  const { data: season, error: readError } = await supabase.from("seasons")
    .select("slug, aftermovie_poster_path").eq("id", seasonId).single();
  if (readError || !season) return actionError("No se pudo leer la Season. Verificá que la carga de portadas esté habilitada.");
  const { data: object, error: objectError } = await supabase.storage.from("season-previews").info(path);
  if (objectError || (object?.contentType ?? object?.metadata?.mimetype) !== "image/webp") return actionError("La imagen WebP no se subió correctamente.");
  const { data, error } = await supabase.from("seasons").update({ aftermovie_poster_path: path })
    .eq("id", seasonId).select("id");
  if (error) return actionError(`No se pudo guardar la portada: ${error.message}`);
  if (affectedNone(data)) return actionError(NO_ROWS);
  revalidateSite(season.slug);
  return { ok: true };
});
