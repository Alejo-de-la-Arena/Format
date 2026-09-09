"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { getShapePath } from "@/components/shapePaths";
import { introStorageKey, shouldAutoIntro, type IntroMotion } from "@/lib/season-intro";
import type { Forma } from "@/lib/types";
import styles from "./home-motion.module.css";

export interface IntroIdentity {
  slug: string; fechaInicio: string; numero: string; nombre: string;
  forma: Forma; color: string; text: string; lead: string; motion: IntroMotion;
}

/** Duración total de cada variante, en sincronía con --out-start del CSS.
 *  Con Season anterior la secuencia son tres momentos (la forma anterior se
 *  arma, la cámara sube, entra la bienvenida); sin ella queda sólo el
 *  último, con el tiempo de siempre. */
const JOURNEY_MS = 10800;
const SOLO_MS = 3800;

const seenInMemory = new Set<string>();

const edition = (numero: string) => numero.padStart(3, "0");
const releasePreflight = () => document.documentElement.removeAttribute("data-intro-preflight");

/** La forma de una Season armándose desde sus cuatro cuartos, tal cual la
 *  intro original: inundación de color, fragmentos que convergen, contorno y
 *  ecos en papel. Los tiempos los pone la escena vía --start. */
function Assembly({ forma, numero }: { forma: Forma; numero: string }) {
  const path = getShapePath(forma, numero);
  return (
    <>
      <div className={styles.flood} aria-hidden />
      <div className={styles.art} aria-hidden>
        {[0, 1, 2, 3].map((i) => <svg key={i} className={styles.fragment} viewBox="0 0 72 72">
          <path d={path} fill="currentColor" />
        </svg>)}
        {[0, 1, 2].map((i) => <svg key={i} className={styles.echo} viewBox="0 0 72 72" style={{ "--echo": i } as CSSProperties}>
          <path d={path} fill="none" stroke="currentColor" strokeWidth="0.3" />
        </svg>)}
        <svg className={styles.outline} viewBox="0 0 72 72"><path d={path} fill="none" stroke="currentColor" strokeWidth="0.65" /></svg>
      </div>
    </>
  );
}

export default function SeasonIntro({ current, previous, onState, showReplay = false, pathname }: {
  current: IntroIdentity; previous: IntroIdentity | null;
  onState: (state: { introOpen: boolean; ready: boolean }) => void;
  showReplay?: boolean;
  pathname: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const replay = useRef<HTMLButtonElement>(null);
  const [run, setRun] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [open, setOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const wasReplay = useRef(false);
  const key = introStorageKey(current);
  const journey = previous !== null;
  const close = useCallback(() => {
    dialog.current?.close?.();
    releasePreflight();
    setOpen(false);
    onState({ introOpen: false, ready: true });
    if (wasReplay.current) replay.current?.focus({ preventScroll: true });
  }, [onState]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(media.matches);
    const sync = () => { setReduced(media.matches); if (media.matches) close(); };
    media.addEventListener("change", sync);
    const start = () => {
      if (document.hidden) return;
      document.removeEventListener("visibilitychange", start);
      let seen = seenInMemory.has(key);
      try { seen ||= sessionStorage.getItem(key) === "1"; } catch { /* Memory fallback. */ }
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      if (shouldAutoIntro({ seen, reduced: media.matches, returning: nav?.type === "back_forward" })) {
        seenInMemory.add(key);
        try { sessionStorage.setItem(key, "1"); } catch { /* Storage is optional. */ }
        setEntered(true);
        setOpen(true);
      } else {
        releasePreflight();
        onState({ introOpen: false, ready: true });
      }
    };
    if (document.hidden) {
      releasePreflight();
      onState({ introOpen: false, ready: true });
      document.addEventListener("visibilitychange", start);
    } else start();
    return () => {
      media.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", start);
    };
  }, [close, key, onState]);

  useEffect(() => {
    const element = dialog.current;
    if (!open || !element) return;
    // Native modal: focus containment, inert page, Escape. No fake loading gate.
    try { if (!element.open) element.showModal(); } catch { close(); return; }
    // `showModal` and this release share the same task, so the first visible
    // frame contains the modal and never the page underneath by itself.
    releasePreflight();
    onState({ introOpen: true, ready: true });
    const body = document.body;
    const overflow = body.style.overflow;
    const paddingRight = body.style.paddingRight;
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    if (gutter > 0) body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight) + gutter}px`;
    body.style.overflow = "hidden";
    if (!entered) return () => {
      body.style.overflow = overflow;
      body.style.paddingRight = paddingRight;
      element.close();
    };
    const timer = window.setTimeout(close, journey ? JOURNEY_MS : SOLO_MS);
    // Returning from another tab or following an anchor must never resume a gate.
    const hidden = () => { if (document.hidden) close(); };
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("hashchange", close);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("hashchange", close);
      body.style.overflow = overflow;
      body.style.paddingRight = paddingRight;
      element.close();
    };
  }, [close, entered, journey, key, onState, open, run]);

  // Route changes never carry a modal over the destination page.
  useEffect(() => () => close(), [close, pathname]);

  return (
    <>
      {showReplay && <button ref={replay} type="button" className={styles.replay} disabled={reduced}
        onClick={() => { wasReplay.current = true; setEntered(true); setRun((n) => n + 1); setOpen(true); }}>
        <span aria-hidden>↻</span> Repetir intro
      </button>}
      <dialog ref={dialog} className={styles.intro} aria-labelledby="season-welcome"
        onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); close(); } }}
        onCancel={(e) => { e.preventDefault(); close(); }}
        style={{ "--intro-accent": current.color, ...(previous && { "--intro-prev": previous.color }) } as CSSProperties}>
        {/* El foco arranca en el marco, no en el título: el título vive dos
            pantallas más arriba y enfocarlo movería la tira. */}
        {open && entered && <div key={run} className={styles.film} tabIndex={-1} autoFocus
          data-motion={current.motion} data-journey={journey ? "on" : "off"}>
          <div className={styles.strip}>
            <section className={styles.sceneTo}>
              <Assembly forma={current.forma} numero={current.numero} />
              {previous && <p className={styles.lead} aria-hidden><span>{current.lead}</span></p>}
              <h2 id="season-welcome" className={styles.welcome}
                style={{ "--welcome-size": current.text.length > 80 ? "clamp(20px,3.7vw,52px)" : current.text.length > 40 ? "clamp(24px,4.8vw,68px)" : "clamp(42px,7vw,96px)" } as CSSProperties}>
                {current.text.split(/\r?\n/).map((line, i) =>
                  <span key={i} style={{ "--line": i } as CSSProperties}>{line || " "}</span>)}
              </h2>
            </section>
            {previous && <>
              <div className={styles.corridor} aria-hidden>
                <div className={styles.rungs} />
                <div className={styles.shaft} />
                {[0, 1, 2, 3, 4].map((i) => <svg key={`prev-${i}`} className={styles.trailPrev} viewBox="0 0 72 72" style={{ "--i": i } as CSSProperties}>
                  <path d={getShapePath(previous.forma, `${previous.numero}-${i}`)} fill="currentColor" />
                </svg>)}
                {[0, 1, 2, 3, 4].map((i) => <svg key={`next-${i}`} className={styles.trailNext} viewBox="0 0 72 72" style={{ "--i": i } as CSSProperties}>
                  <path d={getShapePath(current.forma, `${current.numero}-${i}`)} fill="currentColor" />
                </svg>)}
              </div>
              <section className={styles.sceneFrom} aria-hidden>
                <p className={styles.originComplete}>
                  <span>{edition(previous.numero)} — {previous.nombre.toUpperCase()}</span>
                  <small>Complete.</small>
                </p>
                <Assembly forma={previous.forma} numero={previous.numero} />
              </section>
            </>}
          </div>
          <div className={styles.speed} aria-hidden />
          <div className={styles.registration} aria-hidden><span>+</span><span>+</span><span>+</span><span>+</span></div>
          <span className={styles.edition}>
            <span>FORMAT /</span>
            {previous
              ? <span className={styles.editionNums}>
                <b className={styles.editionPrev} aria-hidden>{edition(previous.numero)}</b>
                <b className={styles.editionNext}>{edition(current.numero)}</b>
              </span>
              : <span>{edition(current.numero)}</span>}
          </span>
          <div className={styles.filmFooter}><span>Made by sound.</span><span>Shaped by people.</span></div>
          <div className={styles.halftone} aria-hidden />
        </div>}
      </dialog>
    </>
  );
}
