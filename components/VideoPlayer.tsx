"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { getShapePath } from "@/components/shapePaths";
import { EDGES } from "@/components/TapeBlock";
import {
  getPlatformThumbnail,
  parseVideoUrl,
  withAutoplay,
  withMutedPreview,
} from "@/lib/embed";
import type { Forma } from "@/lib/types";

const EASE = [0.65, 0, 0.35, 1] as const;

/**
 * Player de YouTube/Vimeo con poster propio o miniatura de plataforma.
 *
 * El iframe NO existe hasta que se aprieta play: antes hay un poster armado
 * con los mecanismos de la marca (sticker de la forma de la Season sobre
 * trama de puntos en el acento, cinta con el título). Resuelve tres cosas de
 * una: cero chrome de la plataforma en reposo y cero requests a Google/Vimeo
 * hasta que hay intención de mirar. FORMAT Lab puede usar la miniatura
 * original de YouTube sin superponer tratamiento de marca.
 *
 * Los sugeridos del final se limitan con los parámetros de cada plataforma
 * (ver lib/embed.ts). El movimiento del poster es puramente decorativo, así
 * que se apaga entero con prefers-reduced-motion; el play sigue andando.
 */
export default function VideoPlayer({
  url,
  titulo,
  kicker,
  forma,
  accent,
  /** CSS aspect-ratio del marco. El aftermovie mantiene 9:16 por defecto;
   * los clips de Lab pasan su proporción guardada. */
  aspect = "9 / 16",
  preview = false,
  posterSrc,
  posterStyle = "brand",
  allowExpand = false,
  className,
}: {
  url: string;
  /** Va en la cinta del poster y en el title del iframe. */
  titulo: string;
  /** Etiqueta chica arriba del título ("Aftermovie", el orden del clip…). */
  kicker?: string;
  forma: Forma;
  accent: string;
  aspect?: string;
  /** Muestra el video real en silencio antes de la interacción. */
  preview?: boolean;
  posterSrc?: string;
  /** Para clips de YouTube: su miniatura real, sin placa ni overlay propio. */
  posterStyle?: "brand" | "platform";
  /** Abre una vista a pantalla completa; el control sólo se muestra en desktop. */
  allowExpand?: boolean;
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [thumbnailFallback, setThumbnailFallback] = useState(false);
  const [posterUnavailable, setPosterUnavailable] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const expandButton = useRef<HTMLButtonElement>(null);
  const closeExpand = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();
  const embed = parseVideoUrl(url);

  // URL inválida: no dibujamos un marco roto, la sección decide qué mostrar.

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    document.body.style.overflow = "hidden";
    closeExpand.current?.focus();
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      expandButton.current?.focus();
    };
  }, [expanded]);

  if (!embed) return null;
  const platformThumbnail = posterStyle === "platform" ? getPlatformThumbnail(embed) : undefined;
  const thumbnailSrc = posterStyle === "platform"
    ? (!posterUnavailable && posterSrc
      ? posterSrc
      : thumbnailFallback
        ? platformThumbnail?.replace("maxresdefault.jpg", "hqdefault.jpg")
        : platformThumbnail)
    : undefined;

  return (
    <div
      className={`relative w-full overflow-hidden border border-line bg-ink ${className ?? ""}`}
      style={{ aspectRatio: aspect }}
    >
      {playing || preview ? (
        <iframe
          src={playing ? withAutoplay(embed) : withMutedPreview(embed)}
          title={titulo}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : thumbnailSrc ? (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Reproducir ${titulo}`}
          className="absolute inset-0 block overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-accent-1"
        >
          <Image
            src={thumbnailSrc}
            alt=""
            fill
            sizes="(max-width: 1023px) 100vw, 50vw"
            className="object-contain"
            onError={() => {
              if (posterSrc && !posterUnavailable) setPosterUnavailable(true);
              else setThumbnailFallback(true);
            }}
          />
        </button>
      ) : (
        <motion.button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Reproducir ${titulo}`}
          initial="rest"
          whileHover="hover"
          whileFocus="hover"
          className="absolute inset-0 flex cursor-pointer items-center justify-center overflow-hidden"
          style={{ "--poster-accent": accent } as CSSProperties}
        >
          {posterSrc && (
            <Image
              src={posterSrc}
              alt=""
              fill
              sizes="(max-width: 767px) 100vw, 500px"
              className="object-cover"
            />
          )}
          {/* Trama de semitono en el acento sobre ink: dos rejillas
              desfasadas media celda, igual que el resto del sitio. */}
          <span
            aria-hidden
            className={`absolute inset-0 opacity-40 ${posterSrc ? "hidden" : ""}`}
            style={{
              backgroundImage:
                "radial-gradient(var(--poster-accent) 1px, transparent 1.2px), radial-gradient(var(--poster-accent) 1px, transparent 1.2px)",
              backgroundSize: "9px 9px",
              backgroundPosition: "0 0, 4.5px 4.5px",
            }}
          />

          {/* Sticker de la forma de la Season, escalado al marco. */}
          <motion.svg
            aria-hidden
            viewBox="0 0 72 72"
            className={`absolute left-1/2 top-1/2 h-auto w-[64%] -translate-x-1/2 -translate-y-1/2 ${posterSrc ? "hidden" : ""}`}
            variants={{ rest: { rotate: -7 }, hover: { rotate: reduced ? -7 : -2.5 } }}
            transition={{ duration: reduced ? 0 : 0.28, ease: [...EASE] }}
          >
            <path d={getShapePath(forma, titulo)} fill={accent} />
          </motion.svg>

          {/* PLAY — cuadrado de papel pegado torcido, con el triángulo
              calado. Sin border-radius: el sitio no usa esquinas redondas. */}
          <motion.span
            aria-hidden
            className="relative flex h-[clamp(50px,9vw,66px)] w-[clamp(50px,9vw,66px)] items-center justify-center bg-paper"
            style={{ clipPath: EDGES[3] }}
            variants={{
              rest: { rotate: 4, scale: 1 },
              hover: { rotate: reduced ? 4 : 1, scale: reduced ? 1 : 1.07 },
            }}
            transition={{ duration: reduced ? 0 : 0.2, ease: [...EASE] }}
          >
            <svg viewBox="0 0 24 24" className="h-[42%] w-[42%] translate-x-[6%] text-ink" aria-hidden>
              <path d="M4 2 L21 12 L4 22 Z" fill="currentColor" />
            </svg>
          </motion.span>

          {/* Cinta con el título, colgada del borde inferior. */}
          <span className={`absolute inset-x-0 bottom-[6%] flex flex-col items-center gap-1.5 px-3 ${posterSrc ? "hidden" : ""}`}>
            {kicker && (
              <span
                className="label-mono inline-block bg-paper px-2 py-1 text-ink"
                style={{ transform: "rotate(1.8deg)", clipPath: EDGES[3] }}
              >
                {kicker}
              </span>
            )}
            <span
              className="inline-block max-w-full truncate bg-ink px-[0.55em] py-[0.26em] text-[clamp(15px,1.5vw,22px)] font-black uppercase leading-tight tracking-tight text-paper"
              style={{ transform: "rotate(-1.4deg)", clipPath: EDGES[2] }}
            >
              {titulo}
            </span>
          </span>
        </motion.button>
      )}
      {preview && !playing && (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 flex items-end justify-start bg-gradient-to-t from-ink/85 via-transparent to-transparent p-4 text-left"
          aria-label={`Reproducir ${titulo} con sonido`}
        >
          <span className="label-mono inline-flex items-center gap-2 bg-paper px-3 py-2 text-ink transition-transform group-hover:-translate-y-1">
            <span aria-hidden className="text-base leading-none">▶</span>
            Ver con sonido
          </span>
        </button>
      )}
      {allowExpand && (
        <button
          ref={expandButton}
          type="button"
          onClick={() => setExpanded(true)}
          className="label-mono absolute right-3 top-3 z-10 hidden bg-paper px-3 py-2 text-ink shadow-[3px_3px_0_var(--color-ink)] transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-1 lg:inline-flex"
          aria-label={`Ampliar ${titulo}`}
        >
          Ampliar
        </button>
      )}
      {expanded && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Video ampliado: ${titulo}`}
          className="fixed inset-0 z-[2147483647] grid place-items-center bg-ink/95 p-6 lg:p-10"
        >
          <div className="relative w-full max-w-[min(92vw,1440px)] aspect-video bg-black">
            <iframe
              src={withAutoplay(embed, true)}
              title={titulo}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
            <button
              ref={closeExpand}
              type="button"
              onClick={() => setExpanded(false)}
              className="label-mono absolute -right-1 -top-12 bg-paper px-3 py-2 text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
            >
              Cerrar
            </button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
