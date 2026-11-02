import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_DENIED_PATH, ADMIN_LOGIN_PATH, isAdmin } from "@/lib/auth/is-admin";

/**
 * Refresca la sesión de Supabase en cada request y bloquea /admin/** sin
 * usuario admin (misma regla que requireAdmin y que RLS). Patrón obligatorio de @supabase/ssr: sin esto el token
 * expira silenciosamente en Server Components.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isLoginRoute = request.nextUrl.pathname === "/admin/login";

  // Las Server Actions llegan como POST a la ruta de la página. Un redirect
  // acá rompe el fetch de la acción ("Failed to fetch") y el usuario no ve
  // nada; cada acción llama a requireAdmin, que redirige por el protocolo
  // de Next.
  const isServerAction = request.method === "POST" && request.headers.has("next-action");

  if (isAdminRoute && !isLoginRoute && !isServerAction && !isAdmin(user)) {
    const target = request.nextUrl.clone();
    const [pathname, search = ""] = (user ? ADMIN_DENIED_PATH : ADMIN_LOGIN_PATH).split("?");
    target.pathname = pathname;
    target.search = search ? `?${search}` : "";
    const redirect = NextResponse.redirect(target);
    // Conserva las cookies de sesión que Supabase haya refrescado.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  return response;
}
