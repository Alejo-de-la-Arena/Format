"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * Botón que pide confirmación inline antes de ejecutar una acción
 * destructiva (borrar Season/Fecha/foto/slot). `action` es una Server
 * Action ya bindeada con sus argumentos.
 */
export default function ConfirmButton({
  action,
  label,
  confirmLabel = "¿Confirmar?",
  className,
}: {
  action: () => Promise<void>;
  label: string;
  confirmLabel?: string;
  className?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-xs text-muted">{confirmLabel}</span>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              try {
                await action();
                setConfirming(false);
                router.refresh();
              } catch (err) {
                setError(err instanceof Error ? err.message : "No se pudo completar la acción.");
              }
            })
          }
          className="label-mono border border-red-600 px-2.5 py-1.5 text-red-600 transition-colors hover:bg-red-600 hover:text-paper disabled:opacity-60"
        >
          {pending ? "Borrando…" : "Sí, borrar"}
        </button>
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
          className="label-mono border border-line px-2.5 py-1.5 text-muted"
        >
          Cancelar
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className={
        className ??
        "label-mono border border-line px-2.5 py-1.5 text-muted transition-colors hover:border-red-600 hover:text-red-600"
      }
    >
      {label}
    </button>
  );
}
