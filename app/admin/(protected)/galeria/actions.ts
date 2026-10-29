"use server";

import { revalidatePath } from "next/cache";
import { adminAction } from "@/lib/auth/admin-action";
import {
  actionError,
  affectedNone,
  orphanWarning,
  removeStorageObject,
  runUpdates,
  type ActionResult,
} from "@/lib/admin/action-result";

function revalidateSeason(seasonSlug: string) {
  revalidatePath(`/eventos/${seasonSlug}`);
  revalidatePath("/admin");
}

export const attachFoto = adminAction(async (
  { supabase },
  fechaId: string,
  seasonSlug: string,
  storagePath: string,
  orden: number,
): Promise<ActionResult<{ id: string }>> => {
  const { data, error } = await supabase
    .from("fotos_galeria")
    .insert({ fecha_id: fechaId, storage_path: storagePath, orden })
    .select("id")
    .single();
  if (error) return actionError(error.message);
  revalidateSeason(seasonSlug);
  return { ok: true, id: data.id };
});

export const deleteFoto = adminAction(async (
  { supabase },
  id: string,
  storagePath: string,
  seasonSlug: string,
): Promise<ActionResult> => {
  // Primero la fila, después el archivo (mismo criterio que removeFlyer).
  const { data, error } = await supabase
    .from("fotos_galeria")
    .delete()
    .eq("id", id)
    .eq("storage_path", storagePath)
    .select("id");
  if (error) return actionError(error.message);
  if (affectedNone(data)) {
    return actionError("No se pudo borrar la foto: sin permisos o ya no existe.");
  }
  revalidateSeason(seasonSlug);

  const storageError = await removeStorageObject(supabase, "galerias", storagePath);
  if (storageError) {
    return { ok: true, warning: orphanWarning("galerias", storagePath, storageError) };
  }
  return { ok: true };
});

export const reorderFotos = adminAction(async (
  { supabase },
  fotos: { id: string; orden: number }[],
  seasonSlug: string,
): Promise<ActionResult> => {
  const error = await runUpdates(
    fotos.map((f) =>
      supabase.from("fotos_galeria").update({ orden: f.orden }).eq("id", f.id).select("id"),
    ),
  );
  if (error) return actionError(error);
  revalidateSeason(seasonSlug);
  return { ok: true };
});
