import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Resultado de las Server Actions del admin. Se devuelve el error en vez de
 * tirarlo: en producción Next reemplaza el mensaje de un throw por uno
 * genérico y la UI no podría decir qué pasó.
 *
 * OJO: este archivo no es "use server" a propósito. Todo lo que exporta un
 * archivo "use server" queda expuesto como endpoint.
 */
export type ActionResult<T extends object = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

export function actionError(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

/** Update/delete que no tocó filas: RLS lo bloqueó o el registro ya no está. */
export const NO_ROWS =
  "No se guardó: sin permisos o el registro ya no existe. Recargá el panel.";

/** Reordenar falló, quizá a medias: la UI lo avisa en vez de revertir. */
export const REORDER_FAILED =
  "No se pudo guardar el orden completo. Recargá el panel para ver el orden guardado.";

export function affectedNone(data: unknown[] | null): boolean {
  return !data || data.length === 0;
}

type UpdateResult = { data: unknown[] | null; error: { message: string } | null };

/**
 * Corre varios update(...).select() y devuelve el primer error, o null si
 * todos tocaron al menos una fila. Espera a todos: no corta a la mitad.
 */
export async function runUpdates(queries: PromiseLike<UpdateResult>[]): Promise<string | null> {
  const results = await Promise.all(queries);
  const error = results.find((result) => result.error)?.error;
  if (error) return error.message;
  if (results.some((result) => affectedNone(result.data))) return NO_ROWS;
  return null;
}

/**
 * Borra un objeto de Storage y devuelve un mensaje de error, o null si quedó
 * borrado. `remove()` no da error cuando RLS lo bloquea ni cuando el archivo
 * no existe (devuelve una lista vacía). Para distinguirlos se consulta la
 * URL pública (los buckets de FORMAT son públicos), que no depende de RLS:
 * si ya no está, se considera borrado.
 */
export async function removeStorageObject(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).remove([path]);
  if (error) return `No se pudo borrar el archivo: ${error.message}`;
  if (data && data.length > 0) return null;

  try {
    const { publicUrl } = supabase.storage.from(bucket).getPublicUrl(path).data;
    const res = await fetch(publicUrl, { method: "HEAD", cache: "no-store" });
    if (res.ok) return "No se pudo borrar el archivo: sin permisos.";
    if (res.status === 400 || res.status === 404) return null;
    return "No se pudo confirmar el borrado del archivo. Probá de nuevo.";
  } catch {
    return "No se pudo confirmar el borrado del archivo. Probá de nuevo.";
  }
}
