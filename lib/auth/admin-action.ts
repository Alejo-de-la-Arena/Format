import { requireAdmin } from "./require-admin";

export type AdminContext = Awaited<ReturnType<typeof requireAdmin>>;

/**
 * Envuelve una Server Action del admin: requireAdmin corre antes que
 * cualquier otra cosa y la acción recibe el cliente ya autenticado.
 *
 * Toda acción exportada desde un archivo "use server" de app/admin tiene que
 * pasar por acá (lo verifica tests/admin-actions.test.mjs). No es un archivo
 * "use server": si lo fuera, el propio wrapper quedaría expuesto.
 */
export function adminAction<Args extends unknown[], Result>(
  fn: (ctx: AdminContext, ...args: Args) => Promise<Result>,
): (...args: Args) => Promise<Result> {
  return async (...args: Args) => fn(await requireAdmin(), ...args);
}
