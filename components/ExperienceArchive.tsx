"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { preload } from "react-dom";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import ShapeSticker from "@/components/ShapeSticker";
import EventGallery from "@/components/EventGallery";
import { fechaLarga, rangoHorario } from "@/lib/dates";
import { getSeasonColors } from "@/lib/season-colors";
import { seasonAccentVars } from "@/lib/theme";
import type { Fecha, Season } from "@/lib/types";
import styles from "./experience-archive.module.css";

const SPRING = { type: "spring" as const, stiffness: 260, damping: 30 };
type Entry = { fecha: Fecha; season: Season };
function Pattern({ season }: { season: Season }) {
  const color = getSeasonColors(season)[0];
  return <div className={styles.pattern} aria-hidden>{[0, 1, 2].map((i) =>
    <ShapeSticker key={i} forma={season.forma} color={color} size={40}
      rotate={season.forma === "triangle" ? 180 : i * 9 - 9} seed={`${season.slug}-${i}`} />
  )}</div>;
}

export default function ExperienceArchive({ entries }: { entries: Entry[] }) {
  const id = useId();
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState<Entry | null>(null);
  const [revealed, setRevealed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const scrollStyle = useRef<string | null>(null);
  const close = () => { setActive(null); setRevealed(false); };
  const restore = () => {
    dialog.current?.close();
    if (scrollStyle.current !== null) document.body.style.overflow = scrollStyle.current;
    scrollStyle.current = null;
    trigger.current?.focus({ preventScroll: true });
  };
  useEffect(() => {
    setMounted(true);
    return () => { if (scrollStyle.current !== null) document.body.style.overflow = scrollStyle.current; };
  }, []);
  useEffect(() => {
    if (!active || !dialog.current) return;
    if (!dialog.current.open) dialog.current.showModal();
    if (scrollStyle.current === null) scrollStyle.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current.querySelector<HTMLButtonElement>("[data-close]")?.focus({ preventScroll: true });
    if (reduced) setRevealed(true);
  }, [active, reduced]);
  const warm = (entry: Entry) => {
    const flyer = entry.fecha.flyer;
    if (flyer) preload(typeof flyer === "string" ? flyer : flyer.src, { as: "image" });
  };
  return <LayoutGroup id={id}>
    <div className={styles.grid} data-experience-grid>
      {entries.map((entry) => <motion.button key={entry.fecha.fecha} type="button"
        layoutId={reduced ? undefined : entry.fecha.fecha} transition={SPRING}
        className={styles.tile} style={{ ...seasonAccentVars(entry.season), visibility: active?.fecha.fecha === entry.fecha.fecha ? "hidden" : "visible" }}
        aria-expanded={active?.fecha.fecha === entry.fecha.fecha} aria-controls={`${id}-panel`}
        onMouseEnter={() => warm(entry)} onFocus={() => warm(entry)}
        onClick={(event) => { trigger.current = event.currentTarget; setRevealed(false); setActive(entry); }}>
        <Pattern season={entry.season} />
        <span>{fechaLarga(entry.fecha.fecha)}</span><strong>{entry.season.nombre}</strong>
        <span className={styles.openLabel}>Ver noche ↗</span>
      </motion.button>)}
    </div>
    {mounted && createPortal(<dialog ref={dialog} role="dialog" className={styles.overlay} aria-modal="true" aria-labelledby={`${id}-title`}
      onKeyDown={(event) => {
        if (event.key !== "Tab" || !event.currentTarget.contains(event.target as Node)) return;
        const targets = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex="0"]'))
          .filter((el) => el.getClientRects().length > 0 && !el.closest("[inert]"));
        const first = targets[0], last = targets.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      <AnimatePresence onExitComplete={restore}>
        {active && <motion.div key={active.fecha.fecha} id={`${id}-panel`} data-experience-panel
          layoutId={reduced ? undefined : active.fecha.fecha} transition={reduced ? { duration: .18 } : SPRING}
          initial={reduced ? { opacity: 0 } : false} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onLayoutAnimationComplete={() => setRevealed(true)} className={styles.panel} style={seasonAccentVars(active.season)}>
          <div className={styles.heading}>
            <p>{fechaLarga(active.fecha.fecha)}</p><h2 id={`${id}-title`}>{active.season.nombre}</h2>
            <button type="button" data-close onClick={close} className={styles.close} aria-label="Cerrar detalle">×</button>
            <Pattern season={active.season} />
          </div>
          <motion.div className={styles.content} inert={!revealed} initial="hidden" animate={revealed ? "visible" : "hidden"}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: reduced ? 0 : .07 } } }}>
            <motion.div className={styles.flyer} variants={{ hidden: { opacity: 0, y: reduced ? 0 : 12 }, visible: { opacity: 1, y: 0 } }}>
              {active.fecha.flyer ? <Image src={active.fecha.flyer} alt={`Flyer de ${active.season.nombre} · ${fechaLarga(active.fecha.fecha)}`}
                fill sizes="(max-width: 700px) 86vw, 430px" priority={false} className={styles.image} />
                : <p>El flyer de esta noche llega pronto.</p>}
            </motion.div>
            <motion.div className={styles.details} variants={{ hidden: { opacity: 0, y: reduced ? 0 : 12 }, visible: { opacity: 1, y: 0 } }}>
              <p>Av. Costanera Rafael Obligado 4801</p>
              {rangoHorario(active.fecha.horaInicio, active.fecha.horaFin) && <p>{rangoHorario(active.fecha.horaInicio, active.fecha.horaFin)}</p>}
              {active.fecha.tragoAutor && <p><strong>Cocktail:</strong> {active.fecha.tragoAutor.nombre}</p>}
              <Link href={`/eventos/${active.season.slug}?fecha=${active.fecha.fecha}`}>Ver la fecha ↗</Link>
              <EventGallery fotos={(active.fecha.galeria ?? []).map((src, index) => ({ src, alt: `${active.season.nombre} · foto ${index + 1}` }))}
                colors={getSeasonColors(active.season)} forma={active.season.forma} />
            </motion.div>
          </motion.div>
        </motion.div>}
      </AnimatePresence>
    </dialog>, document.body)}
  </LayoutGroup>;
}
