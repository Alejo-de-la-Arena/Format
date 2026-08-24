"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import RotatingText, { type RotatingTextRef } from "@/components/RotatingText/RotatingText";
import { EDGES } from "@/components/TapeBlock";
import { SEASON_SEQUENCE } from "@/lib/season-sequence";
import {
  MORPH_VIEWBOX,
  morphPath,
  sampleShape,
  type ShapeSample,
} from "@/lib/shape-morph";

/** Duración del morph de la silueta. */
const MORPH_MS = 900;
/** El fondo va más lento a propósito: el ambiente cambia DESPUÉS de la forma. */
const BG_MS = 1200;
/** Autoplay entre Seasons. */
const HOLD_MS = 4000;
/** El nombre entra apenas después del número, para que no aterricen juntos. */
const NAME_STAGGER_MS = 80;

const MORPH_EASE = [0.65, 0, 0.35, 1] as const;

/** Silueta de cada Season, muestreada una sola vez al cargar el módulo. */
const SAMPLES: ShapeSample[] = SEASON_SEQUENCE.map((s) =>
  sampleShape(s.forma, s.numero),
);

const NUMEROS = SEASON_SEQUENCE.map((s) => s.numero);
const NOMBRES = SEASON_SEQUENCE.map((s) => s.nombre.toUpperCase());

/** Inclinación y desfase de cada tramo punteado entre marcadores. Valores
 *  fijos (nada de Math.random, que rompería la hidratación): la línea queda
 *  quebrada como trazada a mano en vez de perfectamente horizontal. */
const RAIL_SEGMENTS = [
  { rotate: -1.6, y: 1 },
  { rotate: 1.2, y: -1.5 },
  { rotate: -0.8, y: 1.5 },
  { rotate: 1.9, y: -1 },
];

const RAIL_DASHES =
  "repeating-linear-gradient(to right, var(--color-ink) 0 3px, transparent 3px 8px)";

/** Miniatura estática de una silueta, para los marcadores de la timeline. */
function ShapeMark({ index, color }: { index: number; color: string }) {
  const d = useMemo(() => morphPath(SAMPLES[index], SAMPLES[index], 0), [index]);
  return (
    <svg viewBox={`0 0 ${MORPH_VIEWBOX} ${MORPH_VIEWBOX}`} className="h-full w-full">
      <path d={d} fill={color} />
    </svg>
  );
}

/**
 * Pieza "Qué es FORMAT": un solo foco donde al cambiar de Season cambia todo
 * — silueta, color, fondo de la sección, número y nombre.
 *
 * El morph no hace fade entre formas: las 5 siluetas están muestreadas a los
 * mismos 64 puntos (ver lib/shape-morph.ts), así que interpolar es un lerp
 * radial y la forma se transforma de una en otra de manera continua.
 *
 * El halftone es SVG, no WebGL: un patrón de puntos clippeado contra el MISMO
 * path que se está morfeando, cuyos puntos crecen hasta fundirse mientras el
 * relleno sólido entra por encima. Al compartir el path, queda sincronizado
 * con el morph por construcción y no cuesta un segundo contexto de render.
 *
 * Los colores son locales a esta sección: no tocan --accent-1..5, así que el
 * resto de la home se mantiene en el azul de la Season activa real.
 */
export default function SeasonShowcase({
  className,
  wrapClassName,
  children,
}: {
  className?: string;
  wrapClassName?: string;
  /** Copy estático de la sección, renderizado en el server. */
  children?: ReactNode;
}) {
  // React 19 genera ids con caracteres no válidos para url(#…) — fuera todo
  // lo que no sea alfanumérico.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const clipId = `season-clip-${uid}`;
  const dotsId = `season-dots-${uid}`;

  const reduced = useReducedMotion();
  const [pair, setPair] = useState({ from: 0, to: 0 });
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);

  const sectionRef = useRef<HTMLElement>(null);
  const numeroRef = useRef<RotatingTextRef>(null);
  const nombreRef = useRef<RotatingTextRef>(null);
  /** Season activa, fuera del estado: `goTo` la necesita sin efectos dentro
   *  del updater de setState (que en StrictMode corre dos veces). */
  const toRef = useRef(0);

  // 1 = morph terminado. Arranca completo para que el primer render ya
  // muestre la Season 0 asentada.
  const progress = useMotionValue(1);
  const bgProgress = useMotionValue(1);

  const from = SEASON_SEQUENCE[pair.from];
  const to = SEASON_SEQUENCE[pair.to];

  const goTo = useCallback(
    (next: number) => {
      if (next === toRef.current) return;
      const previo = toRef.current;
      toRef.current = next;
      // Reset ANTES del re-render: el useTransform de abajo se rearma con el
      // par nuevo leyendo progress=0, así el primer frame del morph es
      // exactamente la forma saliente y no hay salto hacia atrás.
      progress.jump(0);
      bgProgress.jump(0);
      setPair({ from: previo, to: next });
    },
    [progress, bgProgress],
  );

  // Morph + fondo. Se relanzan en cada cambio de par; con reduced-motion
  // saltan directo al estado final.
  useEffect(() => {
    if (pair.from === pair.to) return;
    if (reduced) {
      progress.set(1);
      bgProgress.set(1);
      return;
    }
    const shape = animate(progress, 1, {
      duration: MORPH_MS / 1000,
      ease: [...MORPH_EASE],
    });
    const bg = animate(bgProgress, 1, {
      duration: BG_MS / 1000,
      ease: "easeInOut",
    });
    return () => {
      shape.stop();
      bg.stop();
    };
  }, [pair, reduced, progress, bgProgress]);

  // Número y nombre siguen el índice activo, con el nombre apenas atrasado.
  useEffect(() => {
    numeroRef.current?.jumpTo(pair.to);
    const t = setTimeout(() => nombreRef.current?.jumpTo(pair.to), NAME_STAGGER_MS);
    return () => clearTimeout(t);
  }, [pair.to]);

  // Autoplay: se reinicia con cada cambio (incluido el click manual), y se
  // frena en hover o cuando la sección no está en viewport.
  useEffect(() => {
    if (reduced || paused || !visible) return;
    const t = setTimeout(
      () => goTo((pair.to + 1) % SEASON_SEQUENCE.length),
      HOLD_MS,
    );
    return () => clearTimeout(t);
  }, [pair.to, paused, visible, reduced, goTo]);

  // No gastar frames animando algo fuera de pantalla.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const d = useTransform(progress, (p) =>
    morphPath(SAMPLES[pair.from], SAMPLES[pair.to], p),
  );
  const fill = useTransform(progress, [0, 1], [from.colores[0], to.colores[0]]);
  const rotate = useTransform(progress, [0, 1], [from.tilt, to.tilt]);
  // La trama se resuelve mientras la forma termina de transformarse: los
  // puntos crecen hasta tocarse y el sólido entra por encima sobre el final.
  const dotRadius = useTransform(progress, [0, 0.85], [0.7, 3.4], { clamp: true });
  const dotsOpacity = useTransform(progress, [0.72, 1], [1, 0], { clamp: true });
  const solidOpacity = useTransform(progress, [0.45, 1], [0, 1], { clamp: true });
  const bg = useTransform(bgProgress, [0, 1], [from.colores[3], to.colores[3]]);

  const activa = SEASON_SEQUENCE[pair.to];

  return (
    <motion.section
      ref={sectionRef}
      className={`relative isolate overflow-hidden ${className ?? ""}`}
      style={
        {
          "--season-bg": bg,
          backgroundColor: "var(--season-bg)",
        } as CSSProperties
      }
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Trama sobre el color: dos rejillas de puntos desfasadas media celda,
          que es como se arma una pantalla de semitono a 45° — a una sola
          rejilla ortogonal le queda cara de papel cuadriculado. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.17] mix-blend-multiply"
        style={{
          backgroundImage:
            "radial-gradient(var(--color-ink) 1px, transparent 1.15px), radial-gradient(var(--color-ink) 1px, transparent 1.15px)",
          backgroundSize: "8px 8px",
          backgroundPosition: "0 0, 4px 4px",
        }}
      />

      <div className={wrapClassName}>
        {children}

        {/* Los tres elementos se pisan a propósito: el número muerde el borde
            superior de la silueta y la cinta del nombre cuelga del inferior,
            así la pieza lee como un collage pegado a mano y no como cinco
            cosas apiladas y centradas en la grilla. */}
        <div className="mt-6 flex flex-col items-center">
          {/* Lectores de pantalla: la pieza es decorativa salvo por esto. */}
          <p aria-live="polite" className="sr-only">
            Season {activa.numero} — {activa.nombre}
          </p>

          {/* El contenedor se ajusta a la silueta (inline-block, no w-full):
              número y cinta se posicionan contra el borde de la FORMA, no
              contra el ancho de la sección. */}
          <div className="relative inline-block pb-[clamp(26px,4vw,40px)]">
          {/* LA FORMA */}
          <motion.svg
            aria-hidden
            viewBox={`0 0 ${MORPH_VIEWBOX} ${MORPH_VIEWBOX}`}
            className="h-[clamp(196px,26vw,320px)] w-[clamp(196px,26vw,320px)]"
            style={{ rotate }}
          >
            <defs>
              <pattern
                id={dotsId}
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
              >
                <motion.circle cx="3" cy="3" r={dotRadius} fill={fill} />
              </pattern>
              <clipPath id={clipId}>
                <motion.path d={d} />
              </clipPath>
            </defs>

            <g clipPath={`url(#${clipId})`}>
              <motion.rect
                x="0"
                y="0"
                width={MORPH_VIEWBOX}
                height={MORPH_VIEWBOX}
                fill={`url(#${dotsId})`}
                style={{ opacity: dotsOpacity }}
              />
            </g>
            <motion.path d={d} fill={fill} style={{ opacity: solidOpacity }} />
          </motion.svg>

          {/* NÚMERO — flip vertical, con perspectiva para que sea un giro
              real y no un aplastado. Pisa el borde superior de la silueta. */}
          <span
            className="absolute top-[4%] -right-[7%] z-[1]"
            style={{ rotate: "2.5deg" }}
          >
            <RotatingText
              ref={numeroRef}
              texts={NUMEROS}
              auto={false}
              splitBy="characters"
              staggerDuration={reduced ? 0 : 0.025}
              staggerFrom="first"
              initial={{ rotateX: -90, opacity: 0 }}
              animate={{ rotateX: 0, opacity: 1 }}
              exit={{ rotateX: 90, opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.32, ease: [...MORPH_EASE] }}
              mainClassName="justify-center bg-ink px-2.5 py-1 font-body text-[clamp(13px,1.5vw,17px)] font-bold uppercase tabular-nums tracking-[0.36em] text-paper [perspective:420px]"
              elementLevelClassName="[transform-style:preserve-3d]"
              style={{ clipPath: EDGES[3] }}
            />
          </span>

          {/* NOMBRE, en cinta que cuelga del borde inferior de la silueta y
              reajusta su ancho. La rotación va en un wrapper aparte: Motion no
              soporta `layout` y `rotate` en el mismo elemento (la medición de
              layout ignora la rotación y el bloque tiembla al cambiar de
              ancho). El centrado es por flex, no por translate, por el mismo
              motivo. */}
          <div className="absolute inset-x-0 bottom-0 z-[1] flex justify-center">
            <span className="inline-block" style={{ rotate: "-1.6deg" }}>
              <motion.span
                layout
                aria-hidden
                transition={{ duration: reduced ? 0 : 0.42, ease: [...MORPH_EASE] }}
                className="inline-block bg-ink px-[0.6em] py-[0.26em] font-body text-[clamp(28px,6vw,58px)] font-black uppercase leading-[1.05] tracking-tight text-paper"
                style={{ clipPath: EDGES[2] }}
              >
                <RotatingText
                  ref={nombreRef}
                  texts={NOMBRES}
                  auto={false}
                  splitBy="characters"
                  staggerDuration={reduced ? 0 : 0.018}
                  staggerFrom="first"
                  initial={{ y: "110%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "-110%", opacity: 0 }}
                  transition={{ duration: reduced ? 0 : 0.38, ease: [...MORPH_EASE] }}
                  mainClassName="justify-center"
                />
              </motion.span>
            </span>
          </div>
          </div>

          {/* TIMELINE */}
          <div className="mt-1 w-full max-w-[300px]">
            <ul className="flex items-center">
              {SEASON_SEQUENCE.map((s, i) => {
                const active = i === pair.to;
                const seg = RAIL_SEGMENTS[i - 1];
                return (
                  <Fragment key={s.numero}>
                    {seg && (
                      <li
                        aria-hidden
                        className="h-px flex-1 opacity-40"
                        style={{
                          backgroundImage: RAIL_DASHES,
                          transform: `rotate(${seg.rotate}deg) translateY(${seg.y}px)`,
                        }}
                      />
                    )}
                    <li>
                    <button
                      type="button"
                      onClick={() => goTo(i)}
                      aria-label={`Season ${s.numero} — ${s.nombre}`}
                      aria-current={active}
                      className="flex h-11 w-11 items-center justify-center focus-visible:outline-2"
                    >
                      <motion.span
                        className="block"
                        animate={{
                          scale: active ? 1 : 0.66,
                          opacity: active ? 1 : 0.38,
                          rotate: active ? s.tilt : 0,
                        }}
                        transition={{
                          duration: reduced ? 0 : 0.32,
                          ease: [...MORPH_EASE],
                        }}
                        style={{ width: 30, height: 30 }}
                      >
                        <ShapeMark index={i} color={s.colores[0]} />
                      </motion.span>
                    </button>
                    </li>
                  </Fragment>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
