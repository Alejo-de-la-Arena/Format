"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_DENIED_MESSAGE, isAdmin } from "@/lib/auth/is-admin";

export type SignInState = { error?: string } | undefined;

export async function signIn(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const captchaToken = String(formData.get("cf-turnstile-response") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
    ...(captchaToken ? { options: { captchaToken } } : {}),
  });

  if (error) {
    // Con CAPTCHA activo en Supabase, un token vencido, usado o ausente no es
    // un problema de credenciales: decirlo para no confundir.
    if (error.code === "captcha_failed") {
      return { error: "No se pudo verificar el captcha. Esperá a que se complete y probá de nuevo." };
    }
    return { error: "Email o contraseña incorrectos." };
  }

  // Credenciales válidas pero sin rol admin: no dejar la sesión abierta.
  if (!isAdmin(data.user)) {
    await supabase.auth.signOut();
    return { error: ADMIN_DENIED_MESSAGE };
  }

  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
