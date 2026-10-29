import type { User } from "@supabase/supabase-js";

/**
 * Admin = `app_metadata.role === "admin"`. app_metadata sólo lo puede
 * cambiar la service role; user_metadata lo edita el propio usuario y no
 * sirve para autorizar. Es la misma regla que aplican las policies de RLS
 * (migración 0011).
 *
 * Archivo sin dependencias de servidor para poder usarlo también en el
 * middleware (Edge).
 */
export function isAdmin(user: Pick<User, "app_metadata"> | null | undefined): boolean {
  return user?.app_metadata?.role === "admin";
}

export const ADMIN_LOGIN_PATH = "/admin/login";
export const ADMIN_DENIED_PARAM = "sin-permisos";
export const ADMIN_DENIED_PATH = `/admin/login?error=${ADMIN_DENIED_PARAM}`;
export const ADMIN_DENIED_MESSAGE = "Esta cuenta no tiene permisos de admin.";
