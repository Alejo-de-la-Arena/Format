"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useAnimate, type AnimationSequence } from "motion/react";
import { EDGES } from "@/components/TapeBlock";
import { roundedDiamondPath } from "@/components/shapePaths";
import { PlantSprig } from "@/components/JunglePlants";
import { hashSeed, mulberry32 } from "@/lib/rng";
import { introStorageKey } from "@/lib/season-intro";
import type { ShapeIntroVariant } from "@/lib/season-shape";
import type { IntroIdentity } from "./SeasonIntro";
import styles from "./shape-intro.module.css";

/*
 * Entrada de las Seasons con forma de contorno: "line" (Pulse: el contorno
 * doble se dibuja, parpadea y golpea) y "grow" (Jungle: el rombo doble se
 * dibuja, crecen lianas desde las esquinas y se abren hojas). Ambas: un
 * único timeline de Motion con destellos halftone, cintas y salida en iris
 * con la forma de la Season. Identidad, colores y frase vienen de la Season.
 */

/** Seconds; one Motion timeline, including its iris exit. */
const TOTAL = 3;
const DRAW = .6;
const FLICKER_AT = .6;
const FLICKER_DURATION = .4;
const HIT_AT = 1;
const HIT_DURATION = .3;
const FLASH_DURATION = .5;
const TAPE_AT = 1.2;
const TAPE_DELAY = .15;
const TAPE_DURATION = .45;
const SECOND_HIT_AT = 2;
const SECOND_HIT_DURATION = .4;
const TAPE_OUT_AT = 2.28;
const TAPE_OUT_DURATION = .12;
const IRIS_AT = 2.4;
const REDUCED_TOTAL = 1;
const REDUCED_TAPE_AT = .12;
const REDUCED_TAPE_DURATION = .18;
const REDUCED_OUT_AT = .75;
const REDUCED_OUT_DURATION = REDUCED_TOTAL - REDUCED_OUT_AT;
const DRAW_EASE: [number, number, number, number] = [.7, 0, .2, 1];
const OUTER = 46;
const INNER = OUTER * .92;

/** Jungle (grow): segundos. Mismo esqueleto, con lianas y hojas en el medio. */
const GROW = {
  TOTAL: 3.2, VINE_AT: .45, VINE_DURATION: .75, VINE_STAGGER: .1,
  LEAF_AT: .85, LEAF_DURATION: .3, LEAF_STAGGER: .045,
  HIT_AT: 1.25, TAPE_AT: 1.4, BREATH_AT: 2.1, BREATH_DURATION: .4,
  TAPE_OUT_AT: 2.48, IRIS_AT: 2.6,
};
const DIAMOND_INNER = .88;
function sweep(progress: number, direction = 1) {
  const points = Array.from({ length: 65 }, (_, i) => {
    const a = -Math.PI / 2 + direction * Math.PI * 2 * progress * i / 64;
    return (50 + 75 * Math.cos(a)) + '% ' + (50 + 75 * Math.sin(a)) + '%';
  });
  return 'polygon(50% 50%, ' + points.join(', ') + ', 50% 50%)';
}
function irisCutout(x: number, y: number, radius: number) {
  const hole = Array.from({ length: 65 }, (_, i) => {
    const a = i / 64 * Math.PI * 2;
    return (x + radius * Math.cos(a)) + 'px ' + (y + radius * Math.sin(a)) + 'px';
  });
  return 'polygon(evenodd, 0px 0px, 100% 0px, 100% 100%, 0px 100%, 0px 0px, ' + hole.join(', ') + ', ' + hole[0] + ')';
}
function diamondCutout(x: number, y: number, r: number) {
  const hole = [[x, y - r], [x + r, y], [x, y + r], [x - r, y], [x, y - r]].map(([a, b]) => `${a}px ${b}px`);
  return 'polygon(evenodd, 0px 0px, 100% 0px, 100% 100%, 0px 100%, 0px 0px, ' + hole.join(', ') + ')';
}
const seen = new Set<string>();

type Flash = { left: number; top: number; size: number; delay: number; color: string };

// Fixed seed per Season: scattered print marks without hydration drift or layout changes.
function flashesFor(slug: string, colors: IntroIdentity["colors"], variant: ShapeIntroVariant): Flash[] {
  const random = mulberry32(hashSeed(`${slug}-entry`));
  const [c1, c2, c3] = colors;
  // line: principal + glow + secundario. grow: destellos principal y ácido.
  const tones = variant === "grow" ? [c3, c1, c3, c1] : [c3, c2, c1, c3];
  return [
    { left: 50, top: 42, size: 92, delay: 0, color: c1 },
    ...Array.from({ length: 4 }, (_, i) => ({
      left: 23 + random() * 54, top: 23 + random() * 40,
      size: 30 + random() * 28, delay: .025 + random() * .12,
      color: tones[i],
    })),
  ];
}

/** Lianas: 3 tallos que salen de esquinas del rombo y lo bordean por afuera. */
const VINE_START = [0, 2, 3];
const VINES = VINE_START.map((corner, v) => {
  const h = 51;
  const vertices = [[50, 50 - h], [50 + h, 50], [50, 50 + h], [50 - h, 50]];
  const [ax, ay] = vertices[corner];
  const [bx, by] = vertices[(corner + 1) % 4];
  const length = Math.hypot(bx - ax, by - ay);
  const [ux, uy] = [(bx - ax) / length, (by - ay) / length];
  // Normal hacia afuera del rombo.
  const [nx, ny] = [uy, -ux];
  const reach = .52 + v * .07;
  const at = (t: number) => {
    const wobble = Math.sin(t * Math.PI * 3.2 + v) * 1.8 * Math.min(1, t * 4);
    return [ax + ux * length * reach * t + nx * wobble, ay + uy * length * reach * t + ny * wobble];
  };
  const points = Array.from({ length: 25 }, (_, i) => at(i / 24));
  const d = "M" + points.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(" L");
  const angle = Math.atan2(uy, ux) * 180 / Math.PI;
  const leaves = [.32, .6, .88].map((t, i) => {
    const [x, y] = at(t);
    return { x, y, rotate: angle + (i % 2 ? 58 : -58) * (v % 2 ? -1 : 1), scale: .75 + i * .12 };
  });
  return { d, leaves };
});

function Flashes({ flashes }: { flashes: Flash[] }) {
  const id = useId().replace(/:/g, "");
  return <div className={styles.flashes} aria-hidden>
    {flashes.map((flash, i) => <svg key={i} viewBox="0 0 100 100"
      data-flash={i} className={styles.flash} style={{ left: `${flash.left}%`, top: `${flash.top}%`,
        width: `min(${flash.size}vw, ${flash.size * 10}px)`, color: flash.color }}>
      <defs>
        <pattern id={`${id}-dots-${i}`} width="3.2" height="3.2" patternUnits="userSpaceOnUse">
          <circle cx="1.6" cy="1.6" r=".72" fill="currentColor" />
        </pattern>
        <radialGradient id={`${id}-radial-${i}`}>
          <stop offset="0" stopColor="white" /><stop offset=".68" stopColor="white" />
          <stop offset="1" stopColor="black" />
        </radialGradient>
        <mask id={`${id}-mask-${i}`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          <circle cx="50" cy="50" r="50" fill={`url(#${id}-radial-${i})`} />
        </mask>
      </defs>
      <rect width="100" height="100" fill={`url(#${id}-dots-${i})`} mask={`url(#${id}-mask-${i})`} />
    </svg>)}
  </div>;
}

export default function ShapeIntro({ current, variant, onState, showReplay, pathname }: {
  current: IntroIdentity;
  variant: ShapeIntroVariant;
  onState: (state: { introOpen: boolean; ready: boolean }) => void;
  showReplay?: boolean;
  pathname: string;
}) {
  const [scope, animate] = useAnimate<HTMLDialogElement>();
  const replay = useRef<HTMLButtonElement>(null);
  const skipRef = useRef<() => void>(() => {});
  const wasReplay = useRef(false);
  const [open, setOpen] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [prepared, setPrepared] = useState(false);
  const [run, setRun] = useState(0);
  const key = introStorageKey(current);
  const diamond = current.forma === "double-diamond";
  const [c1, c2] = current.colors;
  const flashes = useMemo(() => flashesFor(current.slug, current.colors, variant), [current.slug, current.colors, variant]);
  const welcome = `WELCOME TO ${current.nombre.toUpperCase()}`;
  const phrase = current.text;
  const close = useCallback(() => {
    seen.add(key);
    try { sessionStorage.setItem(key, "1"); } catch { /* Storage is optional. */ }
    scope.current?.close();
    delete document.documentElement.dataset.introPreflight;
    setOpen(false);
    onState({ introOpen: false, ready: true });
    if (wasReplay.current) replay.current?.focus({ preventScroll: true });
  }, [key, onState, scope]);

  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(media.matches);
    setPrepared(true);
    const sync = () => setReduced(media.matches);
    media.addEventListener("change", sync);
    const start = () => {
      if (document.hidden) return;
      document.removeEventListener("visibilitychange", start);
      let remembered = seen.has(key);
      try { remembered ||= sessionStorage.getItem(key) === "1"; } catch { /* Memory fallback. */ }
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      if (!remembered && nav?.type !== "back_forward") {
        setOpen(true);
      } else {
        setOpen(false);
        scope.current?.close();
        delete document.documentElement.dataset.introPreflight;
        onState({ introOpen: false, ready: true });
      }
    };
    if (document.hidden) {
      onState({ introOpen: true, ready: false });
      document.addEventListener("visibilitychange", start);
    } else start();
    return () => { media.removeEventListener("change", sync); document.removeEventListener("visibilitychange", start); };
  }, [key, onState, scope]);

  useEffect(() => {
    const dialog = scope.current;
    if (!prepared || !open || !dialog) return;
    let disposed = false;
    let skipping = false;
    let remembered = seen.has(key);
    try { remembered ||= sessionStorage.getItem(key) === "1"; } catch { /* Memory fallback. */ }
    if (remembered && !wasReplay.current) return;
    if (dialog.open) dialog.close();
    try { dialog.showModal(); } catch { close(); return; }
    dialog.dataset.active = "";
    delete document.documentElement.dataset.introPreflight;
    onState({ introOpen: true, ready: true });
    dialog.querySelector<HTMLElement>("[data-paper]")?.focus({ preventScroll: true });
    const body = document.body;
    const overflow = body.style.overflow;
    const padding = body.style.paddingRight;
    const gutter = innerWidth - document.documentElement.clientWidth;
    if (gutter > 0) body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight) + gutter}px`;
    body.style.overflow = "hidden";
    const home = document.querySelector<HTMLElement>("[data-home-content]");
    const oldClip = home?.style.clipPath ?? "";

    const grow = variant === "grow";
    const irisAt = grow ? GROW.IRIS_AT : IRIS_AT;
    const irisDuration = (grow ? GROW.TOTAL : TOTAL) - irisAt;
    const tapeOutAt = grow ? GROW.TAPE_OUT_AT : TAPE_OUT_AT;
    // Iris con la forma de la Season: círculo (Pulse) o rombo (Jungle).
    const cutout = diamond ? diamondCutout : irisCutout;
    const iris = (at: number): AnimationSequence => {
      const rect = dialog.querySelector<HTMLElement>("[data-ring-position]")!.getBoundingClientRect();
      const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;


      const radius = rect.width * OUTER / 100;
      const maxRadius = diamond
        ? Math.max(x, innerWidth - x) + Math.max(y, innerHeight - y) + 8
        : Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 8;
      const seq: AnimationSequence = [
        ["[data-primary], [data-secondary]", { opacity: [null, 0], y: [null, 14] }, { at: at === irisAt ? tapeOutAt : 0, duration: TAPE_OUT_DURATION, ease: "linear" }],
        ["[data-paper]", { clipPath: at > 0
          ? [cutout(x, y, 0), cutout(x, y, 0), cutout(x, y, radius), cutout(x, y, maxRadius)]
          : [cutout(x, y, radius), cutout(x, y, maxRadius)] },
          { at: 0, duration: at + irisDuration,
            times: at > 0 ? [0, (at - .001) / (at + irisDuration), at / (at + irisDuration), 1] : [0, 1],
            ease: at > 0 ? ["linear", "linear", DRAW_EASE] : DRAW_EASE }],
        ["[data-ring-stage]", { scale: [1, maxRadius / radius] }, { at, duration: irisDuration, ease: DRAW_EASE }],
      ];
      if (home) {
        const origin = home.getBoundingClientRect();
        const [hx, hy] = [x - origin.left, y - origin.top];
        const diamondClip = (r: number) => `polygon(${hx}px ${hy - r}px, ${hx + r}px ${hy}px, ${hx}px ${hy + r}px, ${hx - r}px ${hy}px)`;
        const startClip = diamond ? diamondClip(radius) : `circle(${radius}px at ${hx}px ${hy}px)`;
        const endClip = diamond ? diamondClip(maxRadius) : `circle(${maxRadius}px at ${hx}px ${hy}px)`;
        seq.push([home, { clipPath: at > 0 ? ["none", "none", startClip, endClip] : [startClip, endClip] },
          { at: 0, duration: at + irisDuration,
            times: at > 0 ? [0, (at - .001) / (at + irisDuration), at / (at + irisDuration), 1] : [0, 1],
            ease: at > 0 ? ["linear", "linear", DRAW_EASE] : DRAW_EASE }]);
      }
      return seq;
    };
    const vines = dialog.querySelectorAll("[data-vine]").length;
    const leaves = dialog.querySelectorAll("[data-leaf]").length;
    // Lianas y hojas ya crecidas (movimiento reducido o salto al iris).
    const grown: AnimationSequence = grow ? [
      ["[data-vine]", { strokeDashoffset: 0 }, { at: 0, duration: 0 }],
      ["[data-leaf]", { scale: 1, opacity: 1 }, { at: 0, duration: 0 }],
    ] : [];
    const lineSequence: AnimationSequence = reduced ? [
      ["[data-outer], [data-inner]", { clipPath: sweep(1) }, { at: 0, duration: 0 }],
      ...grown,
      ["[data-ring-stage]", { scale: 1, opacity: 1 }, { at: 0, duration: 0 }],
      ["[data-primary], [data-secondary]", { clipPath: "inset(0 0% 0 0)", y: 0 }, { at: 0, duration: 0 }],
      ["[data-primary]", { opacity: [0, 1] }, { at: REDUCED_TAPE_AT, duration: REDUCED_TAPE_DURATION }],
      ["[data-secondary]", { opacity: [0, 1] }, { at: REDUCED_TAPE_AT + TAPE_DELAY, duration: REDUCED_TAPE_DURATION }],
      ["[data-paper]", { opacity: [1, 0] }, { at: REDUCED_OUT_AT, duration: REDUCED_OUT_DURATION }],
    ] : [
      ["[data-outer]", { clipPath: Array.from({ length: 33 }, (_, i) => sweep(i / 32)) }, { at: 0, duration: DRAW, ease: DRAW_EASE }],
      ["[data-inner]", { clipPath: Array.from({ length: 33 }, (_, i) => sweep(i / 32, -1)) }, { at: 0, duration: DRAW, ease: DRAW_EASE }],
      ["[data-ring-stage]", { opacity: [1, .12, 1, .32, 1, .08, 1] },
        { at: FLICKER_AT, duration: FLICKER_DURATION, times: [0, .08, .15, .37, .43, .69, 1], ease: (t) => t < 1 ? 0 : 1 }],
      ["[data-ring-stage]", { scale: [1, 1.05, 1] }, { at: HIT_AT, duration: HIT_DURATION, times: [0, .42, 1], ease: DRAW_EASE }],
      ["[data-primary]", { clipPath: ["inset(0 100% 0 0)", "inset(0 0% 0 0)"], opacity: [0, 1] }, { at: TAPE_AT, duration: TAPE_DURATION, ease: DRAW_EASE }],
      ["[data-secondary]", { clipPath: ["inset(0 100% 0 0)", "inset(0 0% 0 0)"], opacity: [0, 1] }, { at: TAPE_AT + TAPE_DELAY, duration: TAPE_DURATION, ease: DRAW_EASE }],
      ["[data-ring-stage]", { scale: [1, 1.02, 1] }, { at: SECOND_HIT_AT, duration: SECOND_HIT_DURATION, times: [0, .3, 1], ease: DRAW_EASE }],
      ...iris(IRIS_AT),
    ];
    // Jungle: el rombo se dibuja, crecen las lianas, se abren las hojas,
    // destellos principal/ácido, cintas, respiro e iris en rombo.
    const growSequence: AnimationSequence = [
      ["[data-outer]", { clipPath: Array.from({ length: 33 }, (_, i) => sweep(i / 32)) }, { at: 0, duration: DRAW, ease: DRAW_EASE }],
      ["[data-inner]", { clipPath: Array.from({ length: 33 }, (_, i) => sweep(i / 32, -1)) }, { at: 0, duration: DRAW, ease: DRAW_EASE }],
      ...Array.from({ length: vines }, (_, i): AnimationSequence[number] => [`[data-vine="${i}"]`, { strokeDashoffset: [1, 0] },
        { at: GROW.VINE_AT + i * GROW.VINE_STAGGER, duration: GROW.VINE_DURATION, ease: DRAW_EASE }]),
      ...Array.from({ length: leaves }, (_, i): AnimationSequence[number] => [`[data-leaf="${i}"]`, { scale: [0, 1], opacity: [0, 1] },
        { at: GROW.LEAF_AT + i * GROW.LEAF_STAGGER, duration: GROW.LEAF_DURATION, ease: [.3, 1.5, .5, 1] }]),
      ["[data-ring-stage]", { scale: [1, 1.05, 1] }, { at: GROW.HIT_AT, duration: HIT_DURATION, times: [0, .42, 1], ease: DRAW_EASE }],
      ["[data-primary]", { clipPath: ["inset(0 100% 0 0)", "inset(0 0% 0 0)"], opacity: [0, 1] }, { at: GROW.TAPE_AT, duration: TAPE_DURATION, ease: DRAW_EASE }],
      ["[data-secondary]", { clipPath: ["inset(0 100% 0 0)", "inset(0 0% 0 0)"], opacity: [0, 1] }, { at: GROW.TAPE_AT + TAPE_DELAY, duration: TAPE_DURATION, ease: DRAW_EASE }],
      ["[data-ring-stage]", { scale: [1, 1.02, 1] }, { at: GROW.BREATH_AT, duration: GROW.BREATH_DURATION, times: [0, .3, 1], ease: DRAW_EASE }],
      ...iris(GROW.IRIS_AT),
    ];
    const hitAt = grow ? GROW.HIT_AT : HIT_AT;
    const sequence: AnimationSequence = (reduced || !grow ? lineSequence : growSequence)
      // Sin frase no hay cinta secundaria: sólo "WELCOME TO {NOMBRE}".
      .filter((step) => phrase || !(Array.isArray(step) && step[0] === "[data-secondary]"));
    if (!reduced) flashes.forEach((flash, i) => sequence.push([
      `[data-flash="${i}"]`, { scale: [.05, .76, 1], opacity: [0, .95, 0] },
      { at: hitAt + flash.delay, duration: FLASH_DURATION, times: [0, .3, 1], ease: "linear" },
    ]));
    let controls: ReturnType<typeof animate> | undefined;
    let raf = 0;
    const animated = dialog.querySelectorAll<HTMLElement>("[data-paper], [data-outer], [data-inner], [data-flash], [data-ring-stage], [data-primary], [data-secondary], [data-leaf]");
    const startAnimation = async () => {
      await document.fonts.ready;
      if (disposed || skipping || document.hidden) return;
      raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(() => {
          if (disposed || skipping || document.hidden) return;
          animated.forEach((el) => { el.style.willChange = "transform, opacity, clip-path"; });
          dialog.dataset.started = String(performance.now());
          controls = animate(sequence);
          finishAfter(controls);
        });
      });
    };
    let generation = 0;
    const finishAfter = (animation: ReturnType<typeof animate>) => {
      const token = ++generation;
      void animation.then(() => { if (!disposed && generation === token) close(); });
    };
    void startAnimation();
    skipRef.current = () => {
      if (skipping) return;
      skipping = true;
      generation++;
      controls?.stop();
      const exit: AnimationSequence = reduced
        ? [["[data-paper]", { opacity: [null, 0] }, { duration: .15 }]]
        : [
            ["[data-outer], [data-inner]", { clipPath: sweep(1) }, { at: 0, duration: 0 }],
            ...grown,
            ["[data-flash]", { opacity: 0 }, { at: 0, duration: 0 }],
            ["[data-ring-stage]", { opacity: 1 }, { at: 0, duration: 0 }],
            ...iris(0),
          ];
      controls = animate(exit);
      finishAfter(controls);
    };
    const keydown = (event: KeyboardEvent) => { event.preventDefault(); skipRef.current(); };
    const hidden = () => {
      if (document.hidden) { cancelAnimationFrame(raf); controls?.pause(); }
      else if (controls) controls.play();
      else void startAnimation();
    };
    window.addEventListener("keydown", keydown);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      disposed = true; cancelAnimationFrame(raf); controls?.stop();
      animated.forEach((el) => { el.style.willChange = ""; });
      delete dialog.dataset.active; delete dialog.dataset.started; skipRef.current = () => {};
      window.removeEventListener("keydown", keydown); document.removeEventListener("visibilitychange", hidden);
      body.style.overflow = overflow; body.style.paddingRight = padding;
      if (home) home.style.clipPath = oldClip;
      dialog.close();
    };
  }, [animate, close, diamond, flashes, key, onState, open, phrase, prepared, reduced, run, scope, variant]);

  useEffect(() => {
    return () => { onState({ introOpen: false, ready: true }); };
  }, [onState, pathname]);

  return <>
    {showReplay && <button ref={replay} className={styles.replay} onClick={() => {
      wasReplay.current = true; setRun((n) => n + 1); setOpen(true);
    }}>↻ Repetir intro</button>}
    <dialog open={open} ref={scope} className={styles.intro} aria-labelledby="season-welcome" data-season-intro={variant}
      data-pulse-intro={variant === "line" ? "" : undefined}
      onClick={() => skipRef.current()} onCancel={(event) => { event.preventDefault(); skipRef.current(); }}>
      {open && <div key={run} className={styles.paper} data-paper tabIndex={-1} data-reduced={reduced || undefined}>
        <div className={styles.halftone} aria-hidden />
        {!reduced && <Flashes flashes={flashes} />}
        <div className={styles.ringPosition} data-ring-position aria-hidden>
          <div className={styles.rings} data-ring-stage>
            {(diamond ? [OUTER, OUTER * DIAMOND_INNER] : [OUTER, INNER]).map((radius, i) => <svg key={radius} viewBox="0 0 100 100" fill="none" stroke={c1} strokeWidth="3"
              strokeLinejoin={diamond ? "round" : undefined}
              data-outer={i === 0 ? "" : undefined} data-inner={i === 1 ? "" : undefined}
              style={{ clipPath: reduced ? sweep(1) : sweep(0, i === 0 ? 1 : -1) }}>
              {diamond ? <path d={roundedDiamondPath(50, 50, radius, radius * .12)} /> : <circle cx="50" cy="50" r={radius} />}
            </svg>)}
            {variant === "grow" && <svg viewBox="0 0 100 100" className={styles.vines} aria-hidden>
              {VINES.map((vine, i) => <path key={i} d={vine.d} data-vine={i} pathLength={1} fill="none" stroke={c2}
                strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1" strokeDashoffset={reduced ? 0 : 1} />)}
              {VINES.flatMap((vine) => vine.leaves).map((leaf, i) => <g key={i} transform={`translate(${leaf.x.toFixed(2)} ${leaf.y.toFixed(2)}) rotate(${leaf.rotate.toFixed(1)}) scale(${leaf.scale.toFixed(2)})`}>
                <g data-leaf={i} className={styles.leaf} opacity={reduced ? 1 : 0} style={reduced ? undefined : { transform: "scale(0)" }}>
                  <g transform="rotate(90) scale(.4)" style={{ color: i % 3 === 1 ? c2 : c1 }}>
                    <PlantSprig variant={i} />
                  </g>
                </g>
              </g>)}
            </svg>}
          </div>
        </div>
        <div className={styles.welcome}>
          <h2 id="season-welcome" data-primary className={styles.primary} style={{ color: c1 }}>
            <span style={{ clipPath: EDGES[2] }}>{welcome}</span>
          </h2>
          {phrase && <p data-secondary className={styles.secondary}>
            <span style={{ clipPath: EDGES[1] }}>{phrase}</span>
          </p>}
        </div>
        <span className={styles.edition}>FORMAT / {current.numero.padStart(3, "0")}</span>
        <div className={styles.registration} aria-hidden><span>+</span><span>+</span><span>+</span><span>+</span></div>
      </div>}
    </dialog>
  </>;
}
