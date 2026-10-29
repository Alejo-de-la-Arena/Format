"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  actionError,
  affectedNone,
  NO_ROWS,
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

export async function upsertFecha(
  _prevState: FechaFormState,
  formData: FormData,
): Promise<FechaFormState> {
  const { supabase } = await requireAdmin();
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
}

export async function deleteFecha(id: string, seasonSlug: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("fechas").delete().eq("id", id).select("id");
  if (error) return actionError(error.message);
  if (affectedNone(data)) return actionError(NO_ROWS);
  revalidateSite(seasonSlug);
  return { ok: true };
}

export async function attachFlyer(
  fechaId: string,
  seasonSlug: string,
  path: string,
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("fechas")
    .update({ flyer_path: path })
    .eq("id", fechaId)
    .select("id");
  if (error) return actionError(error.message);
  if (affectedNone(data)) return actionError(NO_ROWS);
  revalidateSite(seasonSlug);
  return { ok: true };
}

/**
 * Primero el archivo, después la referencia: si Storage no lo borra, la
 * fecha sigue apuntando al flyer y se avisa, en vez de dejar un archivo
 * huérfano que nadie ve.
 */
export async function removeFlyer(
  fechaId: string,
  seasonSlug: string,
  path: string,
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const storageError = await removeStorageObject(supabase, "flyers", path);
  if (storageError) return actionError(storageError);

  const { data, error } = await supabase
    .from("fechas")
    .update({ flyer_path: null })
    .eq("id", fechaId)
    .select("id");
  if (error) return actionError(error.message);
  if (affectedNone(data)) return actionError(NO_ROWS);
  revalidateSite(seasonSlug);
  return { ok: true };
}
