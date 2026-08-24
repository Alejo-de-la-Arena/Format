"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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

const MAX_SLIDER_PHOTOS = 8;

export async function addSliderPhoto(
  seasonId: string,
  slug: string,
  storagePath: string,
  orden: number,
): Promise<{ id: string }> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("season_slider_photos")
    .select("id", { count: "exact", head: true })
    .eq("season_id", seasonId);
  if ((count ?? 0) >= MAX_SLIDER_PHOTOS) {
    throw new Error(`El Slider Experience admite hasta ${MAX_SLIDER_PHOTOS} fotos.`);
  }
  const { data, error } = await supabase
    .from("season_slider_photos")
    .insert({ season_id: seasonId, storage_path: storagePath, orden })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidateSite(slug);
  return { id: data.id };
}

export async function deleteSliderPhoto(id: string, storagePath: string, slug: string) {
  const supabase = await createClient();
  const { error: storageError } = await supabase.storage
    .from("season-previews")
    .remove([storagePath]);
  if (storageError) throw new Error(storageError.message);

  const { data, error } = await supabase
    .from("season_slider_photos")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error("No se pudo borrar la foto: sin permisos o ya no existe.");
  }
  revalidateSite(slug);
}

export async function reorderSliderPhotos(
  photos: { id: string; orden: number }[],
  slug: string,
) {
  const supabase = await createClient();
  await Promise.all(
    photos.map((p) =>
      supabase.from("season_slider_photos").update({ orden: p.orden }).eq("id", p.id),
    ),
  );
  revalidateSite(slug);
}
