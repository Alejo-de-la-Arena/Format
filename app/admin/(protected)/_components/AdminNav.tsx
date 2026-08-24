import Link from "next/link";
import { signOut } from "@/app/admin/login/actions";

export default function AdminNav({ email }: { email: string }) {
  return (
    <header className="flex items-center justify-between border-b border-line bg-paper px-[clamp(18px,4vw,32px)] py-4">
      <Link href="/admin" className="label-mono font-bold text-ink">
        FORMAT — Admin
      </Link>
      <div className="flex items-center gap-4">
        <span className="hidden text-sm text-muted sm:inline">{email}</span>
        <form action={signOut}>
          <button
            type="submit"
            className="label-mono border border-line px-3 py-2 text-ink transition-colors hover:border-accent-1"
          >
            Salir
          </button>
        </form>
      </div>
    </header>
  );
}
