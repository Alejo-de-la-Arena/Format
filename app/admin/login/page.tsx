import type { Metadata } from "next";
import { ADMIN_DENIED_MESSAGE, ADMIN_DENIED_PARAM } from "@/lib/auth/is-admin";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Admin — FORMAT",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm">
        <p className="label-mono mb-6 text-center text-muted">FORMAT — Admin</p>
        <LoginForm
          notice={error === ADMIN_DENIED_PARAM ? ADMIN_DENIED_MESSAGE : undefined}
        />
      </div>
    </main>
  );
}
