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

/** Includes the 350ms exit; shared with the CSS timeline. */
const INTRO_MS = 2800;

const seenInMemory = new Set<string>();

const edition = (numero: string) => numero.padStart(3, "0");
const releasePreflight = () => document.documentElement.removeAttribute("data-intro-preflight");

function Assembly({ forma, numero }: { forma: Forma; numero: string }) {
  const path = getShapePath(forma, numero);
  return (
    <>
      <div className={styles.art} aria-hidden>
        {[0, 1, 2, 3].map((i) => <svg key={i} className={styles.fragment} viewBox="0 0 72 72">
          <path d={path} fill="currentColor" />
        </svg>)}
        <svg className={styles.outline} viewBox="0 0 72 72"><path d={path} fill="none" stroke="currentColor" strokeWidth="0.65" /></svg>
      </div>
    </>
  );
}

export default function SeasonIntro({ current, onState, showReplay = false, pathname }: {
  current: IntroIdentity;
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
    const startedAt = performance.now();
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
    const timer = window.setTimeout(close, Math.max(0, INTRO_MS - (performance.now() - startedAt)));
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
  }, [close, entered, key, onState, open, run]);

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
        style={{ "--intro-accent": current.color, "--intro-duration": `${INTRO_MS}ms` } as CSSProperties}>
        {open && entered && <div key={run} className={styles.film} tabIndex={-1} autoFocus
          data-motion={current.motion}>
          <Assembly forma={current.forma} numero={current.numero} />
          <h2 id="season-welcome" className={styles.welcome}
            data-long={current.text.length > 60 || undefined}>
            {current.text && <span className={styles.phrase}>{current.text}</span>}
            <span className={styles.salutation}>Welcome to {current.nombre}</span>
          </h2>
          <div className={styles.registration} aria-hidden><span>+</span><span>+</span><span>+</span><span>+</span></div>
          <span className={styles.edition}>
            <span>FORMAT /</span>
            <span>{edition(current.numero)}</span>
          </span>
          <div className={styles.filmFooter}><span>Made by sound.</span><span>Shaped by people.</span></div>
          <div className={styles.halftone} aria-hidden />
        </div>}
      </dialog>
    </>
  );
}
