import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase para lecturas públicas del sitio (lib/data/*). Sin
 * cookies a propósito — el cliente de @supabase/ssr (lib/supabase/server.ts)
 * llama a next/headers cookies(), lo que fuerza dynamic rendering en TODA
 * página que lo use y además revienta en build time (generateStaticParams,
 * generateMetadata corren fuera de un request scope). Las tablas ya
 * permiten SELECT anónimo vía RLS, así que las lecturas públicas no
 * necesitan sesión — este cliente es liviano y seguro de usar en cualquier
 * contexto, incluido build time.
 */
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
