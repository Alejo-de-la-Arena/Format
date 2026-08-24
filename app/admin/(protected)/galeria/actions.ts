"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function revalidateSeason(seasonSlug: string) {
  revalidatePath(`/eventos/${seasonSlug}`);
  revalidatePath("/admin");
}

export async function attachFoto(
  fechaId: string,
  seasonSlug: string,
  storagePath: string,
  orden: number,
): Promise<{ id: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fotos_galeria")
    .insert({ fecha_id: fechaId, storage_path: storagePath, orden })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidateSeason(seasonSlug);
  return { id: data.id };
}

export async function deleteFoto(id: string, storagePath: string, seasonSlug: string) {
  const supabase = await createClient();
  const { error: storageError } = await supabase.storage.from("galerias").remove([storagePath]);
  if (storageError) throw new Error(storageError.message);

  const { data, error } = await supabase
    .from("fotos_galeria")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error("No se pudo borrar la foto: sin permisos o ya no existe.");
  }
  revalidateSeason(seasonSlug);
}

export async function reorderFotos(
  fotos: { id: string; orden: number }[],
  seasonSlug: string,
) {
  const supabase = await createClient();
  await Promise.all(
    fotos.map((f) => supabase.from("fotos_galeria").update({ orden: f.orden }).eq("id", f.id)),
  );
  revalidateSeason(seasonSlug);
}
