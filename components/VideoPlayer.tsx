"use client";

import { useState, type CSSProperties } from "react";
import { motion, useReducedMotion } from "motion/react";
import { getShapePath } from "@/components/shapePaths";
import { EDGES } from "@/components/TapeBlock";
import { parseVideoUrl, withAutoplay } from "@/lib/embed";
import type { Forma } from "@/lib/types";

const EASE = [0.65, 0, 0.35, 1] as const;

/**
 * Player de YouTube/Vimeo con poster propio.
 *
 * El iframe NO existe hasta que se aprieta play: antes hay un poster armado
 * con los mecanismos de la marca (sticker de la forma de la Season sobre
 * trama de puntos en el acento, cinta con el título). Resuelve tres cosas de
 * una: cero chrome de la plataforma en reposo, cero requests a Google/Vimeo
 * hasta que hay intención de mirar, y un thumbnail que es nuestro y no el
 * frame que eligió el algoritmo — que además, en video vertical, viene con
 * bandas negras a los costados.
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
  /** CSS aspect-ratio del marco. Vertical por defecto: el aftermovie y los
   *  clips de Lab se filman en 9:16. */
  aspect = "9 / 16",
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
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const reduced = useReducedMotion();
  const embed = parseVideoUrl(url);

  // URL inválida: no dibujamos un marco roto, la sección decide qué mostrar.
  if (!embed) return null;

  return (
    <div
      className={`relative w-full overflow-hidden border border-line bg-ink ${className ?? ""}`}
      style={{ aspectRatio: aspect }}
    >
      {playing ? (
        <iframe
          src={withAutoplay(embed)}
          title={titulo}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
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
          {/* Trama de semitono en el acento sobre ink: dos rejillas
              desfasadas media celda, igual que el resto del sitio. */}
          <span
            aria-hidden
            className="absolute inset-0 opacity-40"
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
            className="absolute left-1/2 top-1/2 h-auto w-[64%] -translate-x-1/2 -translate-y-1/2"
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
          <span className="absolute inset-x-0 bottom-[6%] flex flex-col items-center gap-1.5 px-3">
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
    </div>
  );
}
