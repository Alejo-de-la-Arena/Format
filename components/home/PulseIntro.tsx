"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useAnimate, type AnimationSequence } from "motion/react";
import { EDGES } from "@/components/TapeBlock";
import { hashSeed, mulberry32 } from "@/lib/rng";
import { introStorageKey } from "@/lib/season-intro";
import type { IntroIdentity } from "./SeasonIntro";
import styles from "./pulse-intro.module.css";

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
const IRIS_DURATION = TOTAL - IRIS_AT;
const REDUCED_TOTAL = 1;
const REDUCED_TAPE_AT = .12;
const REDUCED_TAPE_DURATION = .18;
const REDUCED_OUT_AT = .75;
const REDUCED_OUT_DURATION = REDUCED_TOTAL - REDUCED_OUT_AT;
const DRAW_EASE: [number, number, number, number] = [.7, 0, .2, 1];
const OUTER = 46;
const INNER = OUTER * .92;
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
const seen = new Set<string>();

// Fixed seed: scattered print marks without hydration drift or layout changes.
const random = mulberry32(hashSeed("pulse-entry"));
const FLASHES = [
  { left: 50, top: 42, size: 92, delay: 0, color: "#E5233B" },
  ...Array.from({ length: 4 }, (_, i) => ({
    left: 23 + random() * 54, top: 23 + random() * 40,
    size: 30 + random() * 28, delay: .025 + random() * .12,
    color: ["#FF6B6B", "#8B0F1D", "#E5233B", "#FF6B6B"][i],
  })),
];

function Flashes() {
  const id = useId().replace(/:/g, "");
  return <div className={styles.flashes} aria-hidden>
    {FLASHES.map((flash, i) => <svg key={i} viewBox="0 0 100 100"
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

export default function PulseIntro({ current, onState, showReplay, pathname }: {
  current: IntroIdentity;
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

    const iris = (at: number): AnimationSequence => {
      const rect = dialog.querySelector<HTMLElement>("[data-ring-position]")!.getBoundingClientRect();
      const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;


      const radius = rect.width * OUTER / 100;
      const maxRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 8;
      const seq: AnimationSequence = [
        ["[data-primary], [data-secondary]", { opacity: [null, 0], y: [null, 14] }, { at: at === IRIS_AT ? TAPE_OUT_AT : 0, duration: TAPE_OUT_DURATION, ease: "linear" }],
        ["[data-paper]", { clipPath: at > 0
          ? [irisCutout(x, y, 0), irisCutout(x, y, 0), irisCutout(x, y, radius), irisCutout(x, y, maxRadius)]
          : [irisCutout(x, y, radius), irisCutout(x, y, maxRadius)] },
          { at: 0, duration: at + IRIS_DURATION,
            times: at > 0 ? [0, (at - .001) / (at + IRIS_DURATION), at / (at + IRIS_DURATION), 1] : [0, 1],
            ease: at > 0 ? ["linear", "linear", DRAW_EASE] : DRAW_EASE }],
        ["[data-ring-stage]", { scale: [1, maxRadius / radius] }, { at, duration: IRIS_DURATION, ease: DRAW_EASE }],
      ];
      if (home) {
        const origin = home.getBoundingClientRect();
        const startClip = `circle(${radius}px at ${x - origin.left}px ${y - origin.top}px)`;
        const endClip = `circle(${maxRadius}px at ${x - origin.left}px ${y - origin.top}px)`;
        seq.push([home, { clipPath: at > 0 ? ["none", "none", startClip, endClip] : [startClip, endClip] },
          { at: 0, duration: at + IRIS_DURATION,
            times: at > 0 ? [0, (at - .001) / (at + IRIS_DURATION), at / (at + IRIS_DURATION), 1] : [0, 1],
            ease: at > 0 ? ["linear", "linear", DRAW_EASE] : DRAW_EASE }]);
      }
      return seq;
    };
    const sequence: AnimationSequence = reduced ? [
      ["[data-outer], [data-inner]", { clipPath: sweep(1) }, { at: 0, duration: 0 }],
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
    if (!reduced) FLASHES.forEach((flash, i) => sequence.push([
      `[data-flash="${i}"]`, { scale: [.05, .76, 1], opacity: [0, .95, 0] },
      { at: HIT_AT + flash.delay, duration: FLASH_DURATION, times: [0, .3, 1], ease: "linear" },
    ]));
    let controls: ReturnType<typeof animate> | undefined;
    let raf = 0;
    const animated = dialog.querySelectorAll<HTMLElement>("[data-paper], [data-outer], [data-inner], [data-flash], [data-ring-stage], [data-primary], [data-secondary]");
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
  }, [animate, close, key, onState, open, prepared, reduced, run, scope]);

  useEffect(() => {
    return () => { onState({ introOpen: false, ready: true }); };
  }, [onState, pathname]);

  return <>
    {showReplay && <button ref={replay} className={styles.replay} onClick={() => {
      wasReplay.current = true; setRun((n) => n + 1); setOpen(true);
    }}>↻ Repetir intro</button>}
    <dialog open={open} ref={scope} className={styles.intro} aria-labelledby="season-welcome" data-pulse-intro
      onClick={() => skipRef.current()} onCancel={(event) => { event.preventDefault(); skipRef.current(); }}>
      {open && <div key={run} className={styles.paper} data-paper tabIndex={-1} data-reduced={reduced || undefined}>
        <div className={styles.halftone} aria-hidden />
        {!reduced && <Flashes />}
        <div className={styles.ringPosition} data-ring-position aria-hidden>
          <div className={styles.rings} data-ring-stage>
            {[OUTER, INNER].map((radius, i) => <svg key={radius} viewBox="0 0 100 100" fill="none" stroke="#E5233B" strokeWidth="3"
              data-outer={i === 0 ? "" : undefined} data-inner={i === 1 ? "" : undefined}
              style={{ clipPath: reduced ? sweep(1) : sweep(0, i === 0 ? 1 : -1) }}>
              <circle cx="50" cy="50" r={radius} />
            </svg>)}
          </div>
        </div>
        <div className={styles.welcome}>
          <h2 id="season-welcome" data-primary className={styles.primary}>
            <span style={{ clipPath: EDGES[2] }}>WELCOME TO PULSE</span>
          </h2>
          <p data-secondary className={styles.secondary}>
            <span style={{ clipPath: EDGES[1] }}>FEEL THE CONNECTION</span>
          </p>
        </div>
        <span className={styles.edition}>FORMAT / {current.numero.padStart(3, "0")}</span>
        <div className={styles.registration} aria-hidden><span>+</span><span>+</span><span>+</span><span>+</span></div>
      </div>}
    </dialog>
  </>;
}
