"use server";

import { revalidatePath } from "next/cache";
import { adminAction } from "@/lib/auth/admin-action";
import {
  actionError,
  affectedNone,
  NO_ROWS,
  orphanWarning,
  removeStorageObject,
  type ActionResult,
} from "@/lib/admin/action-result";

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

export const upsertFecha = adminAction(async (
  { supabase },
  _prevState: FechaFormState,
  formData: FormData,
): Promise<FechaFormState> => {
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

  if (id && !especial) {
    const { count, error: clipsError } = await supabase
      .from("season_lab_clips")
      .select("id", { count: "exact", head: true })
      .eq("fecha_id", id);
    if (clipsError) return { error: clipsError.message };
    if (count && count > 0) {
      return { error: "Borrá los clips de FORMAT Lab antes de convertir esta fecha en Residence." };
    }
  }
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
    ? await supabase.from("fechas").update(payload).eq("id", id).select("id")
    : await supabase.from("fechas").insert(payload).select("id");

  if (error) {
    return { error: error.message };
  }
  if (affectedNone(data)) return { error: NO_ROWS };

  revalidateSite(seasonSlug);
  return { ok: true, id: data[0].id };
});

export const deleteFecha = adminAction(async ({ supabase }, id: string, seasonSlug: string): Promise<ActionResult> => {
  const { data, error } = await supabase.from("fechas").delete().eq("id", id).select("id");
  if (error) return actionError(error.message);
  if (affectedNone(data)) return actionError(NO_ROWS);
  revalidateSite(seasonSlug);
  return { ok: true };
});

export const attachFlyer = adminAction(async (
  { supabase },
  fechaId: string,
  seasonSlug: string,
  path: string,
): Promise<ActionResult> => {
  const { data, error } = await supabase
    .from("fechas")
    .update({ flyer_path: path })
    .eq("id", fechaId)
    .select("id");
  if (error) return actionError(error.message);
  if (affectedNone(data)) return actionError(NO_ROWS);
  revalidateSite(seasonSlug);
  return { ok: true };
});

/**
 * Primero la referencia, después el archivo: si Storage falla, el flyer ya
 * no se ve en la web y queda un archivo huérfano invisible (se avisa y se
 * loguea), en vez de una fecha apuntando a un flyer roto.
 *
 * El update exige que la fecha todavía apunte a `path`, así nunca se borra
 * un archivo que la base ya no referencia.
 */
export const removeFlyer = adminAction(async (
  { supabase },
  fechaId: string,
  seasonSlug: string,
  path: string,
): Promise<ActionResult> => {
  const { data, error } = await supabase
    .from("fechas")
    .update({ flyer_path: null })
    .eq("id", fechaId)
    .eq("flyer_path", path)
    .select("id");
  if (error) return actionError(error.message);
  if (affectedNone(data)) return actionError(NO_ROWS);
  revalidateSite(seasonSlug);

  const storageError = await removeStorageObject(supabase, "flyers", path);
  if (storageError) return { ok: true, warning: orphanWarning("flyers", path, storageError) };
  return { ok: true };
});
