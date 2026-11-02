"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { signIn, type SignInState } from "./actions";

type Turnstile = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback?: () => void;
      "error-callback"?: (code: string) => boolean | void;
      "expired-callback"?: () => void;
    },
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

export default function LoginForm({ notice }: { notice?: string }) {
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [state, formAction, pending] = useActionState<SignInState, FormData>(
    signIn,
    undefined,
  );

  // Render explícito para poder resetear el widget: cada token de Turnstile
  // sirve una sola vez, así que hay que pedir uno nuevo después de cada
  // intento de login, salga bien o mal.
  const widgetContainer = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [captchaError, setCaptchaError] = useState(false);

  const renderWidget = useCallback(() => {
    if (!turnstileSiteKey || !widgetContainer.current || !window.turnstile || widgetId.current) return;
    widgetId.current = window.turnstile.render(widgetContainer.current, {
      sitekey: turnstileSiteKey,
      callback: () => setCaptchaError(false),
      // Sin este callback Turnstile tira una excepción no capturada. Se
      // avisa y el widget muestra su propio estado de error.
      "error-callback": () => {
        setCaptchaError(true);
        return true;
      },
    });
  }, [turnstileSiteKey]);

  useEffect(() => {
    renderWidget();
    return () => {
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [renderWidget]);

  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending && widgetId.current) {
      window.turnstile?.reset(widgetId.current);
    }
    wasPending.current = pending;
  }, [pending]);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      {turnstileSiteKey && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onReady={renderWidget}
        />
      )}
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
      {(state?.error ?? notice) && (
        <p role="alert" className="text-sm text-red-600">
          {state?.error ?? notice}
        </p>
      )}
      {turnstileSiteKey && <div ref={widgetContainer} data-turnstile />}
      {captchaError && (
        <p role="alert" className="text-sm text-red-600">
          No se pudo completar la verificación. Recargá la página y probá de nuevo.
        </p>
      )}
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
