"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";

const transition = { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const };

/**
 * Panel de navegación mobile. Cubre 80% del ancho / 100% del alto, entra
 * desde la derecha. z-index por encima de todo el sitio (nav sticky,
 * fondo three.js del hero, lightbox de la galería).
 */
export default function MobileMenu({
  open,
  onClose,
  links,
}: {
  open: boolean;
  onClose: () => void;
  links: { href: string; label: string }[];
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            aria-hidden
            className="fixed inset-0 z-[299] bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Menú"
            className="fixed inset-y-0 right-0 z-[300] flex h-full w-[80%] max-w-[420px] flex-col bg-paper"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={transition}
          >
            <div className="flex h-[60px] items-center justify-end border-b border-line px-[clamp(18px,4vw,48px)]">
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Cerrar menú"
                className="label-mono text-muted transition-colors hover:text-accent-1"
              >
                Cerrar ✕
              </button>
            </div>
            <nav className="flex flex-1 flex-col justify-center gap-2 px-[clamp(18px,4vw,48px)]">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={onClose}
                  className="border-b border-line py-4 text-3xl font-extrabold tracking-tight transition-colors hover:text-accent-1"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
