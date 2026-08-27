"use client";

import { useId, useMemo } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import SectionTitle from "@/components/SectionTitle";
import { EDGES } from "@/components/TapeBlock";
import { getShapePath } from "@/components/shapePaths";
import { getNextSeason } from "@/lib/season-sequence";
import type { Forma } from "@/lib/types";

const EASE: [number, number, number, number] = [0.65, 0, 0.35, 1];
/** viewBox compartido con el resto de las formas del sitio. */
const VIEWBOX = 72;

/** Grano de fotocopia: ruido fractal SVG inline, sin pedir ningún asset. */
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

/** Alto de la fila de siluetas. Las tres se centran contra esta línea. */
const ROW = "clamp(74px,9.5vw,104px)";

/**
 * Entrada escalonada: papel que cae, sin easing flotante. El contenedor
 * necesita sus propias `variants` — sin ellas motion no propaga la etiqueta
 * de variante a los hijos y la línea se queda en `hidden`.
 */
const LINEA: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const ITEM: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: EASE } },
};

/**
 * Un tramo de la línea: rulo de tinta que une una silueta con la siguiente.
 * `faint` para el que va hacia lo que todavía no se cuenta.
 */
function Tramo({ faint = false }: { faint?: boolean }) {
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center"
      style={{ height: ROW, width: "clamp(12px,2.4vw,26px)" }}
    >
      <span
        className="block h-[2px] w-full"
        style={
          faint
            ? {
                opacity: 0.2,
                backgroundImage:
                  "repeating-linear-gradient(to right, var(--color-ink) 0 3px, transparent 3px 6px)",
              }
            : { opacity: 0.4, backgroundColor: "var(--color-ink)" }
        }
      />
    </span>
  );
}

/**
 * Lo que sigue después de la Season revelada: una silueta sin identidad.
 *
 * Es un recorte de papel rasgado relleno de trama — NO una forma de Season.
 * A propósito no recibe ningún dato: ni nombre, ni color, ni forma, ni
 * cuántas faltan. Ni el markup ni los atributos dicen qué viene. Se apaga con
 * blur y una máscara que lo desvanece contra el borde, así se lee que la
 * secuencia continúa sin poder deducir hacia dónde.
 */
function Difuso() {
  const fade = "linear-gradient(to right, #000 10%, transparent 100%)";
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center"
      style={{ height: ROW, maskImage: fade, WebkitMaskImage: fade }}
    >
      <span
        className="block shrink-0"
        style={{
          width: `calc(${ROW} * 0.46)`,
          height: `calc(${ROW} * 0.46)`,
          opacity: 0.26,
          filter: "blur(2.5px)",
          transform: "rotate(-7deg)",
          clipPath: EDGES[2],
          backgroundColor: "var(--color-ink)",
          backgroundImage:
            "radial-gradient(var(--color-paper-2) 1.1px, transparent 1.3px)",
          backgroundSize: "6px 6px",
        }}
      />
      <span
        className="block shrink-0"
        style={{
          width: `calc(${ROW} * 0.32)`,
          height: `calc(${ROW} * 0.32)`,
          marginLeft: "clamp(8px,1.6vw,16px)",
          opacity: 0.18,
          filter: "blur(4px)",
          transform: "rotate(5deg)",
          clipPath: EDGES[3],
          backgroundColor: "var(--color-ink)",
        }}
      />
    </span>
  );
}

/**
 * "Qué es FORMAT": qué pasa cada mes, y hacia dónde va la secuencia.
 *
 * El indicio se lee como línea de tiempo, sin etiquetas de estado: la Season
 * en curso abre la línea sólida y a tamaño completo con el nombre en cinta,
 * la que sigue va después más chica y en trama (menos presencia, pero
 * identificable por forma y color), y la línea se pierde en una silueta
 * difusa que no revela nada. La jerarquía la hacen la posición y el
 * tratamiento, no el texto.
 *
 * Dinámico por construcción: la activa llega de Supabase y la siguiente sale
 * de SEASON_SEQUENCE por posición (ver getNextSeason). Cuando la Season
 * activa pase a Ascent, la línea abre con Ascent y muestra Pulse detrás, sin
 * tocar código.
 *
 * Los colores son locales a la sección: no tocan --accent-1..5, así que el
 * resto de la home se queda en el acento de la Season activa real.
 */
export default function WhatIsFormat({
  activa,
  className,
  wrapClassName,
}: {
  /** Season activa real (Supabase). null si todavía no hay ninguna cargada. */
  activa: { numero: string; nombre: string; forma: Forma; color: string } | null;
  className?: string;
  wrapClassName?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const dotsId = `seq-dots-${uid}`;
  const clipId = `seq-clip-${uid}`;

  const reduced = useReducedMotion();
  const { siguiente, restantes } = useMemo(() => getNextSeason(activa), [activa]);

  const pathActiva = useMemo(
    () => (activa ? getShapePath(activa.forma, activa.numero) : ""),
    [activa],
  );
  const pathSiguiente = useMemo(
    () => (siguiente ? getShapePath(siguiente.forma, siguiente.numero) : ""),
    [siguiente],
  );

  return (
    <section
      className={`relative isolate overflow-hidden bg-paper-2 ${className ?? ""}`}
    >
      {/* Trama de semitono a 45°: dos rejillas desfasadas media celda. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.16] mix-blend-multiply"
        style={{
          backgroundImage:
            "radial-gradient(var(--color-ink) 1px, transparent 1.15px), radial-gradient(var(--color-ink) 1px, transparent 1.15px)",
          backgroundSize: "8px 8px",
          backgroundPosition: "0 0, 4px 4px",
        }}
      />
      {/* Grano de fotocopia encima de la trama. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.22] mix-blend-multiply"
        style={{ backgroundImage: GRAIN }}
      />
      {/* Dos cintas pegadas contra los bordes, medio salidas del cuadro. La
          de acento se oculta en mobile: ahí la línea de tiempo baja hasta ese
          rincón y la cinta se confundiría con la silueta difusa. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-10 top-5 -z-10 h-6 w-44 bg-ink opacity-[0.16]"
        style={{ transform: "rotate(-3deg)", clipPath: EDGES[2] }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-12 bottom-7 -z-10 hidden h-7 w-52 opacity-30 md:block"
        style={{
          transform: "rotate(2.4deg)",
          clipPath: EDGES[1],
          backgroundColor: activa?.color ?? "var(--color-ink)",
        }}
      />

      <div className={wrapClassName}>
        <div className="mx-auto grid max-w-[1080px] items-center gap-[clamp(22px,4vw,56px)] md:grid-cols-[minmax(0,1fr)_auto]">
          {/* COPY */}
          <div>
            <SectionTitle title="Qué es FORMAT" />
            <p className="m-0 max-w-[22ch] text-[clamp(23px,3vw,38px)] font-black leading-[1.12] tracking-tight">
              Cada mes la terraza cambia por completo.
            </p>
            <p className="mt-3 max-w-[44ch] text-[15px] text-muted">
              Música electrónica, escenografía completa y un cocktail para el
              opening de cada Season.
            </p>
          </div>

          {/* PRÓXIMAMENTE — la línea de tiempo. */}
          {activa && siguiente && (
            <motion.div
              variants={LINEA}
              initial={reduced ? false : "hidden"}
              whileInView="show"
              viewport={{ once: true, margin: "0px 0px -12% 0px" }}
              className="justify-self-start md:justify-self-end"
            >
              {/* La rotación va como prop de motion, no como transform en
                  style: motion maneja el transform y lo pisaría. */}
              <motion.span
                variants={ITEM}
                className="label-mono inline-block bg-ink px-2 py-1 text-paper"
                style={{ rotate: -1.6, clipPath: EDGES[3] }}
              >
                Próximamente
              </motion.span>

              {/* El margen negativo saca la cola del padding del wrap: lo
                  difuso queda cortado por el overflow-hidden de la sección. */}
              <div className="mt-3 -mr-[clamp(18px,6vw,96px)] flex items-start">
                {/* Abre la línea: sólida, tamaño completo, nombre en cinta. */}
                <motion.div variants={ITEM} className="flex flex-col items-center gap-2">
                  <span
                    className="flex items-center justify-center"
                    style={{ height: ROW, width: ROW }}
                  >
                    <svg
                      aria-hidden
                      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
                      className="h-full w-full"
                      style={{ transform: "rotate(-4deg)" }}
                    >
                      <path d={pathActiva} fill={activa.color} />
                    </svg>
                  </span>
                  <span
                    className="inline-block whitespace-nowrap bg-ink px-[0.55em] py-[0.24em] text-[clamp(14px,1.8vw,21px)] font-black uppercase leading-none tracking-tight text-paper"
                    style={{ transform: "rotate(-1.4deg)", clipPath: EDGES[2] }}
                  >
                    {activa.numero} {activa.nombre}
                  </span>
                </motion.div>

                <motion.span variants={ITEM}>
                  <Tramo />
                </motion.span>

                {/* Después: más chica, en trama y sin cinta — presente pero
                    con menos peso. Se identifica por silueta y color. */}
                <motion.div variants={ITEM} className="flex flex-col items-center gap-2">
                  <span
                    className="flex items-center justify-center"
                    style={{ height: ROW, width: `calc(${ROW} * 0.64)` }}
                  >
                    <svg
                      aria-hidden
                      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
                      className="h-full w-full opacity-70"
                      style={{ transform: `rotate(${siguiente.tilt}deg)` }}
                    >
                      <defs>
                        <pattern
                          id={dotsId}
                          width="5"
                          height="5"
                          patternUnits="userSpaceOnUse"
                        >
                          <circle cx="2.5" cy="2.5" r="1.6" fill={siguiente.colores[0]} />
                        </pattern>
                        <clipPath id={clipId}>
                          <path d={pathSiguiente} />
                        </clipPath>
                      </defs>
                      <g clipPath={`url(#${clipId})`}>
                        <rect
                          x="0"
                          y="0"
                          width={VIEWBOX}
                          height={VIEWBOX}
                          fill={`url(#${dotsId})`}
                        />
                      </g>
                      <path
                        d={pathSiguiente}
                        fill="none"
                        stroke={siguiente.colores[0]}
                        strokeWidth="1.6"
                        opacity="0.6"
                      />
                    </svg>
                  </span>
                  <span className="whitespace-nowrap text-[clamp(11px,1.3vw,15px)] font-bold uppercase tracking-[0.08em] text-muted opacity-75">
                    {siguiente.numero} {siguiente.nombre}
                  </span>
                </motion.div>

                {/* Y después: sin forma, sin nombre, sin color. */}
                {restantes > 0 && (
                  <motion.span variants={ITEM} className="flex items-start">
                    <Tramo faint />
                    <Difuso />
                  </motion.span>
                )}
              </div>

              <p className="sr-only">
                Seasons de FORMAT: {activa.numero} {activa.nombre}, después{" "}
                {siguiente.numero} {siguiente.nombre}
                {restantes > 0 ? ", y más por anunciar." : "."}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
