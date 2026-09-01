"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Botón "Volver" de cada página interna. No se renderiza en la home: ahí no
 * hay a dónde volver.
 *
 * Vive dentro de NavClient, en flujo justo debajo del header fijo, así queda
 * arriba a la izquierda de cualquier página sin taparle el contenido.
 */
export default function BackButton() {
  const pathname = usePathname();
  const router = useRouter();
  // El historial sólo se puede leer en el cliente: hasta entonces asumimos que
  // no hay, y el botón se comporta como un link a la home.
  const [hasHistory, setHasHistory] = useState(false);

  useEffect(() => {
    // Si llegaste desde otra página del sitio, "Volver" es volver de verdad.
    // Si entraste directo (link de Instagram a /eventos/origin, por ejemplo),
    // router.back() te sacaría del sitio: en ese caso vamos a la home.
    setHasHistory(
      typeof document !== "undefined" &&
        document.referrer.startsWith(window.location.origin),
    );
  }, [pathname]);

  if (pathname === "/") return null;

  return (
    <div className="mx-auto max-w-[1400px] px-[clamp(18px,4vw,48px)] pb-1 pt-[clamp(14px,2.5vw,22px)]">
      <button
        type="button"
        onClick={() => (hasHistory ? router.back() : router.push("/"))}
        className="group inline-flex -rotate-[1.5deg] items-center gap-2 border-2 border-ink bg-paper-2 px-3 py-2 label-mono text-ink shadow-[3px_3px_0_0_var(--color-accent-1)] transition-[transform,box-shadow,background-color] duration-150 hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-paper hover:shadow-[1px_1px_0_0_var(--color-accent-1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none motion-reduce:transition-none"
      >
        {/* Flecha dibujada, no un carácter: mantiene el grosor del trazo
            igual al borde del bloque en cualquier tamaño de texto. */}
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-[13px] w-[13px] shrink-0 transition-transform duration-150 group-hover:-translate-x-[2px] motion-reduce:transition-none"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="square"
        >
          <path d="M20 12H4" />
          <path d="M10 6 4 12l6 6" />
        </svg>
        Volver
      </button>
    </div>
  );
}
