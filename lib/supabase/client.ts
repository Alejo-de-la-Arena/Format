"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase de browser — usado por los componentes de /admin que
 * suben archivos directo a Storage (evita el límite de tamaño de las
 * Server Actions).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
