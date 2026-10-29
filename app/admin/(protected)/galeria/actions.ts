"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  actionError,
  affectedNone,
  removeStorageObject,
  runUpdates,
  type ActionResult,
} from "@/lib/admin/action-result";

function revalidateSeason(seasonSlug: string) {
  revalidatePath(`/eventos/${seasonSlug}`);
  revalidatePath("/admin");
}

export async function attachFoto(
  fechaId: string,
  seasonSlug: string,
  storagePath: string,
  orden: number,
): Promise<ActionResult<{ id: string }>> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("fotos_galeria")
    .insert({ fecha_id: fechaId, storage_path: storagePath, orden })
    .select("id")
    .single();
  if (error) return actionError(error.message);
  revalidateSeason(seasonSlug);
  return { ok: true, id: data.id };
}

export async function deleteFoto(
  id: string,
  storagePath: string,
  seasonSlug: string,
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const storageError = await removeStorageObject(supabase, "galerias", storagePath);
  if (storageError) return actionError(storageError);

  const { data, error } = await supabase
    .from("fotos_galeria")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) return actionError(error.message);
  if (affectedNone(data)) {
    return actionError("No se pudo borrar la foto: sin permisos o ya no existe.");
  }
  revalidateSeason(seasonSlug);
  return { ok: true };
}

export async function reorderFotos(
  fotos: { id: string; orden: number }[],
  seasonSlug: string,
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const error = await runUpdates(
    fotos.map((f) =>
      supabase.from("fotos_galeria").update({ orden: f.orden }).eq("id", f.id).select("id"),
    ),
  );
  if (error) return actionError(error);
  revalidateSeason(seasonSlug);
  return { ok: true };
}
