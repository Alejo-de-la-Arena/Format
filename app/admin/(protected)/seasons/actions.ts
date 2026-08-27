"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isVideoUrl } from "@/lib/embed";
import type { Forma } from "@/lib/types";

export type SeasonFormState =
  | { error?: string; ok?: boolean; slug?: string }
  | undefined;

function revalidateSite(slug?: string) {
  revalidatePath("/");
  revalidatePath("/fechas");
  revalidatePath("/experience");
  if (slug) revalidatePath(`/eventos/${slug}`);
  revalidatePath("/admin");
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
  if (aftermovieUrl && !isVideoUrl(aftermovieUrl)) {
    return {
      error:
        "El aftermovie tiene que ser una URL de YouTube o Vimeo (youtube.com/watch?v=…, youtu.be/…, vimeo.com/…).",
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
    aftermovie_url: aftermovieUrl || null,
  };

  const { error } = id
    ? await supabase.from("seasons").update(payload).eq("id", id)
    : await supabase.from("seasons").insert(payload);

  if (error) {
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
 * FORMAT LAB — clips por URL. No hay objetos en Storage: el video vive en
 * YouTube/Vimeo, así que borrar un clip es borrar la fila y nada más.
 */
export async function upsertLabClip(
  seasonId: string,
  slug: string,
  clip: { id?: string; titulo: string; url: string; orden: number },
): Promise<{ id: string }> {
  const titulo = clip.titulo.trim();
  const url = clip.url.trim();
  if (!url) throw new Error("Falta la URL del clip.");
  if (!isVideoUrl(url)) {
    throw new Error("La URL tiene que ser de YouTube o Vimeo.");
  }

  const supabase = await createClient();
  const payload = {
    season_id: seasonId,
    titulo,
    video_url: url,
    orden: clip.orden,
  };

  if (clip.id) {
    const { error } = await supabase
      .from("season_lab_clips")
      .update(payload)
      .eq("id", clip.id);
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

export async function deleteLabClip(id: string, slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("season_lab_clips")
    .delete()
    .eq("id", id)
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
  slug: string,
) {
  const supabase = await createClient();
  await Promise.all(
    clips.map((c) =>
      supabase.from("season_lab_clips").update({ orden: c.orden }).eq("id", c.id),
    ),
  );
  revalidateSite(slug);
}
