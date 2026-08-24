import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Admin — FORMAT",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm">
        <p className="label-mono mb-6 text-center text-muted">FORMAT — Admin</p>
        <LoginForm />
      </div>
    </main>
  );
}
