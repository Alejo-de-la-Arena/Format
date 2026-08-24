"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";

/**
 * Rota entre variantes ya renderizadas cada `intervalMs`, con un crossfade
 * sutil. Pensado para Infinity: la Season que cierra la temporada combinando
 * el accent de las 5 anteriores en vez de tener uno fijo. No es un sistema de
 * color nuevo — cada variante ya viene armada con el mismo prop `accent` que
 * consumen Glyph/EventImage; esto sólo elige cuál mostrar.
 */
export default function RotatingAccent({
  variants,
  intervalMs = 3500,
}: {
  variants: ReactNode[];
  intervalMs?: number;
}) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (variants.length <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((v) => (v + 1) % variants.length), intervalMs);
    return () => clearInterval(id);
  }, [variants.length, intervalMs]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={i}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        {variants[i] ?? variants[0]}
      </motion.div>
    </AnimatePresence>
  );
}
