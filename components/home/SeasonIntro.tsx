"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { getShapePath } from "@/components/shapePaths";
import { introStorageKey, shouldAutoIntro, type IntroMotion } from "@/lib/season-intro";
import type { Forma } from "@/lib/types";
import styles from "./home-motion.module.css";

export interface IntroIdentity {
  slug: string; fechaInicio: string; numero: string; nombre: string;
  forma: Forma; color: string; text: string; motion: IntroMotion;
}

const seenInMemory = new Set<string>();

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
  const wasReplay = useRef(false);
  const key = introStorageKey(current);
  const close = useCallback(() => {
    dialog.current?.close?.();
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
        setOpen(true);
        setRun((n) => n + 1);
      } else onState({ introOpen: false, ready: true });
    };
    if (document.hidden) {
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
    try { element.showModal(); } catch { close(); return; }
    onState({ introOpen: true, ready: true });
    seenInMemory.add(key);
    try { sessionStorage.setItem(key, "1"); } catch { /* Storage is optional. */ }
    const body = document.body;
    const overflow = body.style.overflow;
    const paddingRight = body.style.paddingRight;
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    if (gutter > 0) body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight) + gutter}px`;
    body.style.overflow = "hidden";
    const timer = window.setTimeout(close, 3800);
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
  }, [close, key, onState, open, run]);

  // Route changes never carry a modal over the destination page.
  useEffect(() => () => close(), [close, pathname]);

  const path = getShapePath(current.forma, current.numero);
  return (
    <>
      {showReplay && <button ref={replay} type="button" className={styles.replay} disabled={reduced}
        onClick={() => { wasReplay.current = true; setRun((n) => n + 1); setOpen(true); }}>
        <span aria-hidden>↻</span> Repetir intro
      </button>}
      <dialog ref={dialog} className={styles.intro} aria-labelledby="season-welcome"
        onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); close(); } }}
        onCancel={(e) => { e.preventDefault(); close(); }}
        style={{ "--intro-accent": current.color } as CSSProperties}>
        {open && <div key={run} className={styles.film} data-motion={current.motion}>
          <div className={styles.flood} aria-hidden />
          <div className={styles.registration} aria-hidden><span>+</span><span>+</span><span>+</span><span>+</span></div>
          <span className={styles.edition}>FORMAT / {current.numero.padStart(3, "0")}</span>
          {previous && <div className={styles.previous} aria-hidden>
            <svg viewBox="0 0 72 72"><path d={getShapePath(previous.forma, previous.numero)} fill={previous.color} /></svg>
            <span>{previous.nombre} / ✓</span>
          </div>}
          <div className={styles.art} aria-hidden>
            {[0, 1, 2, 3].map((i) => <svg key={i} className={styles.fragment} viewBox="0 0 72 72" style={{ "--part": i } as CSSProperties}>
              <path d={path} fill="currentColor" />
            </svg>)}
            {[0, 1, 2].map((i) => <svg key={i} className={styles.echo} viewBox="0 0 72 72" style={{ "--echo": i } as CSSProperties}>
              <path d={path} fill="none" stroke="currentColor" strokeWidth="0.3" />
            </svg>)}
            <svg className={styles.outline} viewBox="0 0 72 72"><path d={path} fill="none" stroke="currentColor" strokeWidth="0.65" /></svg>
          </div>
          <h2 id="season-welcome" tabIndex={-1} autoFocus className={styles.welcome}
            style={{ "--welcome-size": current.text.length > 80 ? "clamp(20px,3.7vw,52px)" : current.text.length > 40 ? "clamp(24px,4.8vw,68px)" : "clamp(42px,7vw,96px)" } as CSSProperties}>
            {current.text.split(/\r?\n/).map((line, i) =>
            <span key={i} style={{ "--line": i } as CSSProperties}>{line || "\u00a0"}</span>
          )}</h2>
          <div className={styles.filmFooter}><span>Made by sound.</span><span>Shaped by people.</span></div>
          <div className={styles.halftone} aria-hidden />
        </div>}
      </dialog>
    </>
  );
}
