import { requireAdmin } from "@/lib/auth/require-admin";
import AdminNav from "./_components/AdminNav";

/**
 * Guard server-side de /admin (salvo /admin/login, fuera de este route
 * group). El middleware ya redirige sin rol admin; este chequeo es defensa
 * en profundidad. Las Server Actions llaman a requireAdmin por su cuenta:
 * un layout no protege las acciones.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAdmin();

  return (
    <div className="min-h-screen bg-paper">
      <AdminNav email={user.email ?? ""} />
      <main className="mx-auto max-w-[1000px] px-[clamp(18px,4vw,32px)] py-8">
        {children}
      </main>
    </div>
  );
}
