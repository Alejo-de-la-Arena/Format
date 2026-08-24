"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function revalidateSeason(seasonSlug: string) {
  revalidatePath(`/eventos/${seasonSlug}`);
  revalidatePath("/admin");
}

export async function upsertLineupSlot(
  fechaId: string,
  seasonSlug: string,
  slot: {
    id?: string;
    orden: number;
    horaInicio: string;
    horaFin: string;
    artistas: string[];
  },
): Promise<{ id: string }> {
  const supabase = await createClient();
  const payload = {
    fecha_id: fechaId,
    orden: slot.orden,
    hora_inicio: slot.horaInicio || null,
    hora_fin: slot.horaFin || null,
    artistas: slot.artistas,
  };

  if (slot.id) {
    const { error } = await supabase.from("lineup_slots").update(payload).eq("id", slot.id);
    if (error) throw new Error(error.message);
    revalidateSeason(seasonSlug);
    return { id: slot.id };
  }

  const { data, error } = await supabase
    .from("lineup_slots")
    .insert(payload)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidateSeason(seasonSlug);
  return { id: data.id };
}

export async function deleteLineupSlot(id: string, seasonSlug: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("lineup_slots").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateSeason(seasonSlug);
}

/**
 * Reordena en 2 fases para no chocar con el unique (fecha_id, orden):
 * primero corre todo a un rango temporal fuera de uso, después fija los
 * valores finales.
 */
export async function reorderLineupSlots(
  slots: { id: string; orden: number }[],
  seasonSlug: string,
) {
  const supabase = await createClient();
  await Promise.all(
    slots.map((s, i) =>
      supabase.from("lineup_slots").update({ orden: 1000 + i }).eq("id", s.id),
    ),
  );
  await Promise.all(
    slots.map((s) => supabase.from("lineup_slots").update({ orden: s.orden }).eq("id", s.id)),
  );
  revalidateSeason(seasonSlug);
}
