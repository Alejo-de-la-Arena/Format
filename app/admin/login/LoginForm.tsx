"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "./actions";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState<SignInState, FormData>(
    signIn,
    undefined,
  );

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="label-mono text-muted">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="border border-line bg-paper px-3 py-2.5 text-ink outline-none focus:border-accent-1"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="label-mono text-muted">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="border border-line bg-paper px-3 py-2.5 text-ink outline-none focus:border-accent-1"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="label-mono mt-2 bg-ink px-5 py-3 text-paper transition-colors hover:bg-accent-1 disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
