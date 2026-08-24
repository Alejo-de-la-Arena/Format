import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminNav from "./_components/AdminNav";

/**
 * Guard server-side de /admin (salvo /admin/login, fuera de este route
 * group). El middleware ya redirige sin sesión — este chequeo es defensa en
 * profundidad para Server Components/Actions que puedan ejecutarse fuera
 * del flujo de middleware.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-paper">
      <AdminNav email={user.email ?? ""} />
      <main className="mx-auto max-w-[1000px] px-[clamp(18px,4vw,32px)] py-8">
        {children}
      </main>
    </div>
  );
}
