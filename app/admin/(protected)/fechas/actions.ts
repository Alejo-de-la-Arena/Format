"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FechaFormState =
  | { error?: string; ok?: boolean; id?: string }
  | undefined;

function revalidateSite(slug: string) {
  revalidatePath("/");
  revalidatePath("/fechas");
  revalidatePath("/proximas-fechas");
  revalidatePath("/calendario");
  revalidatePath("/archivo");
  revalidatePath("/about");
  revalidatePath("/experience");
  revalidatePath(`/eventos/${slug}`);
  revalidatePath("/admin");
}

export async function upsertFecha(
  _prevState: FechaFormState,
  formData: FormData,
): Promise<FechaFormState> {
  const id = String(formData.get("id") ?? "").trim() || null;
  const seasonId = String(formData.get("seasonId") ?? "").trim();
  const seasonSlug = String(formData.get("seasonSlug") ?? "").trim();
  const fecha = String(formData.get("fecha") ?? "").trim();
  const especial = formData.get("especial") === "on";
  const horaInicio = String(formData.get("horaInicio") ?? "").trim() || null;
  const horaFin = String(formData.get("horaFin") ?? "").trim() || null;
  const barraLibre = especial && formData.get("barraLibre") === "on";
  const tragoNombre = especial
    ? String(formData.get("tragoNombre") ?? "").trim() || null
    : null;
  const tragoDescripcion = especial
    ? String(formData.get("tragoDescripcion") ?? "").trim() || null
    : null;

  if (!seasonId || !fecha) {
    return { error: "Elegí una Season y una fecha." };
  }

  const supabase = await createClient();
  const payload = {
    season_id: seasonId,
    fecha,
    especial,
    hora_inicio: horaInicio,
    hora_fin: horaFin,
    barra_libre: barraLibre,
    trago_nombre: tragoNombre,
    trago_descripcion: tragoDescripcion,
  };

  const { data, error } = id
    ? await supabase.from("fechas").update(payload).eq("id", id).select("id").single()
    : await supabase.from("fechas").insert(payload).select("id").single();

  if (error) {
    return { error: error.message };
  }

  revalidateSite(seasonSlug);
  return { ok: true, id: data.id };
}

export async function deleteFecha(id: string, seasonSlug: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("fechas").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateSite(seasonSlug);
}

export async function attachFlyer(fechaId: string, seasonSlug: string, path: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("fechas")
    .update({ flyer_path: path })
    .eq("id", fechaId);
  if (error) throw new Error(error.message);
  revalidateSite(seasonSlug);
}

export async function removeFlyer(fechaId: string, seasonSlug: string, path: string) {
  const supabase = await createClient();
  await supabase.storage.from("flyers").remove([path]);
  const { error } = await supabase
    .from("fechas")
    .update({ flyer_path: null })
    .eq("id", fechaId);
  if (error) throw new Error(error.message);
  revalidateSite(seasonSlug);
}
