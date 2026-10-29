"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  actionError,
  affectedNone,
  NO_ROWS,
  runUpdates,
  type ActionResult,
} from "@/lib/admin/action-result";

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
): Promise<ActionResult<{ id: string }>> {
  const { supabase } = await requireAdmin();
  const payload = {
    fecha_id: fechaId,
    orden: slot.orden,
    hora_inicio: slot.horaInicio || null,
    hora_fin: slot.horaFin || null,
    artistas: slot.artistas,
  };

  if (slot.id) {
    const { data, error } = await supabase
      .from("lineup_slots")
      .update(payload)
      .eq("id", slot.id)
      .select("id");
    if (error) return actionError(error.message);
    if (affectedNone(data)) return actionError(NO_ROWS);
    revalidateSeason(seasonSlug);
    return { ok: true, id: slot.id };
  }

  const { data, error } = await supabase
    .from("lineup_slots")
    .insert(payload)
    .select("id")
    .single();
  if (error) return actionError(error.message);
  revalidateSeason(seasonSlug);
  return { ok: true, id: data.id };
}

export async function deleteLineupSlot(id: string, seasonSlug: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("lineup_slots").delete().eq("id", id).select("id");
  if (error) return actionError(error.message);
  if (affectedNone(data)) return actionError(NO_ROWS);
  revalidateSeason(seasonSlug);
  return { ok: true };
}

/**
 * Reordena en 2 fases para no chocar con el unique (fecha_id, orden):
 * primero corre todo a un rango temporal fuera de uso, después fija los
 * valores finales. La segunda fase corre aunque la primera falle en alguna
 * fila, para no dejar slots varados en el rango temporal.
 */
export async function reorderLineupSlots(
  slots: { id: string; orden: number }[],
  seasonSlug: string,
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const update = (id: string, orden: number) =>
    supabase.from("lineup_slots").update({ orden }).eq("id", id).select("id");

  const tempError = await runUpdates(slots.map((s, i) => update(s.id, 1000 + i)));
  const finalError = await runUpdates(slots.map((s) => update(s.id, s.orden)));
  const error = finalError ?? tempError;
  if (error) return actionError(error);

  revalidateSeason(seasonSlug);
  return { ok: true };
}
