import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

// Sólo /admin/**: el resto del sitio es público y no debe depender de una
// sesión de Supabase por request (ni pagar ese costo, ni caer si Supabase
// tiene un problema puntual).
export const config = {
  matcher: ["/admin/:path*"],
};
