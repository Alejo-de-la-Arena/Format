"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import type { Forma, ImageSrc } from "@/lib/types";
import ShapeSticker from "@/components/ShapeSticker";

export interface GalleryPhoto {
  /** URL real (Supabase Storage) o id de placeholder mientras no haya foto. */
  src: ImageSrc;
  alt: string;
}

/**
 * Grid de fotos de la noche + lightbox. Si `src` no es una URL real (fase
 * placeholder), muestra el mismo tratamiento (ShapeSticker sobre papel) que
 * EventImage en vez de intentar cargar una imagen inexistente.
 */
export default function EventGallery({
  fotos,
  colors,
  forma,
}: {
  fotos: GalleryPhoto[];
  colors: [string, string, string, string, string];
  forma: Forma;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const close = () => setOpenIndex(null);
  const prev = () =>
    setOpenIndex((i) => (i === null ? i : (i - 1 + fotos.length) % fotos.length));
  const next = () =>
    setOpenIndex((i) => (i === null ? i : (i + 1) % fotos.length));

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, fotos.length]);

  if (fotos.length === 0) {
    return (
      <p className="border border-dashed border-line px-5 py-8 text-center text-sm text-muted">
        Todavía no hay fotos de esta noche.
      </p>
    );
  }

  const isReal = (src: ImageSrc) => typeof src !== "string" || src.startsWith("http") || src.startsWith("/");

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {fotos.map((foto, i) => (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              triggerRef.current = e.currentTarget;
              setOpenIndex(i);
            }}
            className="group relative aspect-square overflow-hidden bg-paper-2"
            aria-label={`Ampliar foto ${i + 1} de ${fotos.length}`}
          >
            {isReal(foto.src) ? (
              <Image
                src={foto.src}
                alt={foto.alt}
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center transition-transform duration-500 group-hover:scale-[1.05]"
                style={{
                  background: `radial-gradient(80% 80% at 50% 50%, color-mix(in srgb, ${colors[2]} 55%, var(--color-paper-2)), var(--color-paper-2) 75%)`,
                }}
              >
                <ShapeSticker
                  forma={forma}
                  color={colors[0]}
                  size={44}
                  rotate={6}
                  seed={`${foto.alt}-${i}`}
                />
              </div>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {openIndex !== null && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Foto ampliada"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
          >
            <button
              type="button"
              onClick={close}
              aria-label="Cerrar"
              className="absolute right-5 top-5 label-mono text-white/70 transition-colors hover:text-accent-1"
            >
              Cerrar ✕
            </button>

            {fotos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    prev();
                  }}
                  aria-label="Foto anterior"
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-3 text-2xl text-white/70 transition-colors hover:text-accent-1 sm:left-6"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    next();
                  }}
                  aria-label="Foto siguiente"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-3 text-2xl text-white/70 transition-colors hover:text-accent-1 sm:right-6"
                >
                  ›
                </button>
              </>
            )}

            <motion.div
              key={openIndex}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="relative aspect-square w-full max-w-[560px]"
              onClick={(e) => e.stopPropagation()}
            >
              {isReal(fotos[openIndex].src) ? (
                <Image
                  src={fotos[openIndex].src}
                  alt={fotos[openIndex].alt}
                  fill
                  sizes="560px"
                  className="object-contain"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{
                    background: `radial-gradient(80% 80% at 50% 50%, color-mix(in srgb, ${colors[2]} 55%, var(--color-paper-2)), var(--color-paper-2) 75%)`,
                  }}
                >
                  <ShapeSticker
                    forma={forma}
                    color={colors[0]}
                    size={112}
                    rotate={4}
                    seed={`${fotos[openIndex].alt}-${openIndex}`}
                  />
                </div>
              )}
            </motion.div>

            {fotos.length > 1 && (
              <span className="absolute bottom-6 label-mono text-white/50">
                {openIndex + 1} / {fotos.length}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
