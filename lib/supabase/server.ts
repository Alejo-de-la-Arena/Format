import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para Server Components y Server Actions. Lee/escribe la
 * sesión vía cookies — el middleware (ver middleware.ts) se encarga de
 * refrescar el token en cada request.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // set() llamado desde un Server Component puro (no una Server
            // Action/Route Handler): el middleware ya refresca la sesión.
          }
        },
      },
    },
  );
}
