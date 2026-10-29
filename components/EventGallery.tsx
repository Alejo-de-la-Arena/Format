"use client";

import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Forma, ImageSrc } from "@/lib/types";
import ShapeSticker from "@/components/ShapeSticker";
import { EDGES } from "@/components/TapeBlock";
import { canShareFiles, fetchPhotoFile, galleryFileName, savePhoto } from "@/lib/gallery-save";

const HINT_MS = 4500;
const SWIPE_PX = 50;

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
  saveAs,
}: {
  fotos: GalleryPhoto[];
  colors: [string, string, string, string, string];
  forma: Forma;
  /** Datos para nombrar el archivo al guardar (`format-{season}-{fecha}-{n}.webp`). */
  saveAs: { season: string; fecha: string };
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hint, setHint] = useState(false);
  const reduced = useReducedMotion();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  // Archivo precargado de la foto abierta: compartir sin esperar la red
  // mantiene vigente el gesto del usuario que exige navigator.share().
  const prefetched = useRef<{ src: string; file: File } | null>(null);
  const isOpen = openIndex !== null;

  // Estables entre renders: el índice se lee del estado previo (setState
  // funcional), así el listener de teclado nunca queda con un valor viejo.
  const total = fotos.length;
  const close = useCallback(() => {
    setOpenIndex(null);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);
  const prev = useCallback(
    () => setOpenIndex((i) => (i === null ? i : (i - 1 + total) % total)),
    [total],
  );
  const next = useCallback(
    () => setOpenIndex((i) => (i === null ? i : (i + 1) % total)),
    [total],
  );

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close, prev, next]);

  useEffect(() => setMounted(true), []);

  // Hint de long-press: aparece al abrir el visor y se va solo.
  useEffect(() => {
    if (!isOpen) return;
    setHint(true);
    const t = window.setTimeout(() => setHint(false), HINT_MS);
    return () => window.clearTimeout(t);
  }, [isOpen]);

  const currentSrc = openIndex === null ? null : srcString(fotos[openIndex]?.src);
  const fileName = openIndex === null ? "" : galleryFileName(saveAs.season, saveAs.fecha, openIndex + 1);

  useEffect(() => {
    if (!currentSrc || !canShareFiles()) return;
    if (prefetched.current?.src === currentSrc) return;
    // Sólo la foto actual: al pasar a otra (o cerrar) se aborta esta descarga.
    const controller = new AbortController();
    fetchPhotoFile(currentSrc, fileName, controller.signal)
      .then((file) => {
        if (!controller.signal.aborted) prefetched.current = { src: currentSrc, file };
      })
      .catch(() => {
        // Abortada o fallida: savePhoto vuelve a intentar al tocar el botón.
      });
    return () => controller.abort();
  }, [currentSrc, fileName]);

  const save = async () => {
    if (!currentSrc || saving) return;
    setSaving(true);
    try {
      const file = prefetched.current?.src === currentSrc ? prefetched.current.file : null;
      await savePhoto(currentSrc, fileName, file);
    } finally {
      setSaving(false);
    }
  };

  // Swipe horizontal para navegar. Sin preventDefault: el long-press nativo
  // sobre la foto ("Guardar imagen") sigue funcionando.
  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = e.touches.length === 1 ? { x: t.clientX, y: t.clientY } : null;
  };
  const onTouchEnd = (e: TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || fotos.length < 2) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    setHint(false);
    if (dx < 0) next();
    else prev();
  };

  useEffect(() => {
    if (openIndex === null) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    try {
      dialog.showModal();
    } catch {
      // Respaldo para navegadores sin top layer nativo: el portal evita que
      // los contextos de apilado del detalle oculten el lightbox.
      dialog.setAttribute("open", "");
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
  }, [openIndex]);

  if (fotos.length === 0) {
    return (
      <p className="border border-dashed border-line px-5 py-8 text-center text-sm text-muted">
        Todavía no hay fotos de esta noche.
      </p>
    );
  }

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

      {mounted &&
        openIndex !== null &&
        createPortal(
          <motion.dialog
            ref={dialogRef}
            aria-label="Foto ampliada"
            // touch-action: el swipe horizontal es nuestro; sin esto Chrome lo
            // toma como gesto de "Atrás" y saca al usuario de la página.
            className="fixed inset-0 z-[2147483647] m-0 flex h-screen max-h-none w-screen max-w-none items-center justify-center overscroll-contain border-0 bg-black/92 p-4 text-inherit [touch-action:pan-y_pinch-zoom] sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            onCancel={(event) => {
              event.preventDefault();
              close();
            }}
            onClick={(event) => {
              if (event.target === event.currentTarget) close();
            }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <button
              type="button"
              onClick={close}
              aria-label="Cerrar"
              className="absolute right-4 top-4 z-10 rounded-sm bg-paper px-3 py-2 label-mono text-ink transition-colors hover:bg-accent-1 sm:right-6 sm:top-6"
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
                  className="absolute left-1 top-1/2 z-10 -translate-y-1/2 p-4 text-3xl text-white/70 transition-colors hover:text-accent-1 sm:left-6"
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
                  className="absolute right-1 top-1/2 z-10 -translate-y-1/2 p-4 text-3xl text-white/70 transition-colors hover:text-accent-1 sm:right-6"
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
              className="relative aspect-square w-full max-w-[min(560px,calc(100dvh-240px))]"
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

            <div className="absolute inset-x-4 bottom-4 flex flex-col items-center gap-2 sm:bottom-6">
              {currentSrc && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void save();
                  }}
                  disabled={saving}
                  aria-label="Guardar foto"
                  aria-busy={saving}
                  className="group inline-flex min-h-11 min-w-11 items-center justify-center disabled:cursor-wait"
                >
                  <span
                    className="label-mono inline-block bg-paper px-4 py-3 text-[12px] text-ink transition-colors group-hover:bg-accent-1 group-disabled:opacity-70 motion-reduce:transition-none"
                    style={{ transform: "rotate(-1.5deg)", clipPath: EDGES[2] }}
                  >
                    {saving ? "Guardando…" : "Guardar ↓"}
                  </span>
                </button>
              )}

              {/* Sólo táctil: el long-press nativo también guarda la foto. */}
              <AnimatePresence>
                {hint && currentSrc && (
                  <motion.p
                    key="hint"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduced ? 0 : 0.2 }}
                    data-touch-hint
                    className="hidden text-center text-[12px] text-white/70 [@media(hover:none)_and_(pointer:coarse)]:block"
                  >
                    Mantené presionada la foto para guardarla
                  </motion.p>
                )}
              </AnimatePresence>

              {fotos.length > 1 && (
                <span className="label-mono text-white/50">
                  {openIndex + 1} / {fotos.length}
                </span>
              )}
            </div>
          </motion.dialog>,
          document.body,
        )}
    </>
  );
}

function isReal(src: ImageSrc): boolean {
  return typeof src !== "string" || src.startsWith("http") || src.startsWith("/");
}

/** URL de la foto en resolución completa, o null si es un placeholder. */
function srcString(src: ImageSrc | undefined): string | null {
  if (!src || !isReal(src)) return null;
  return typeof src === "string" ? src : src.src;
}
