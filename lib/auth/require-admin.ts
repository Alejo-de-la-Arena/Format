import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_DENIED_PATH, ADMIN_LOGIN_PATH, isAdmin } from "./is-admin";

/**
 * Guard server-side del admin. Valida el token contra Supabase Auth
 * (`getUser`, no `getSession`, que sólo lee la cookie sin verificarla) y
 * exige el rol admin. Sin sesión → login; con sesión pero sin rol → login
 * con aviso. Se usa en el layout de /admin y al principio de cada Server
 * Action, además de RLS.
 *
 * Devuelve el cliente ya autenticado para reutilizarlo en la acción.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect(ADMIN_LOGIN_PATH);
  if (!isAdmin(user)) redirect(ADMIN_DENIED_PATH);

  return { supabase, user };
}
