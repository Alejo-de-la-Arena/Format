"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import Link from "next/link";
import { AnimatePresence, motion, type Variants } from "motion/react";
import InstagramLink from "@/components/InstagramLink";
import { getShapePath } from "@/components/shapePaths";
import styles from "./navigation.module.css";
import { EDGES } from "@/components/TapeBlock";
import type { Forma } from "@/lib/types";

const panelTransition = { duration: 0.32, ease: [0.4, 0, 0.2, 1] as const };

const panelVariants: Variants = {
  closed: { x: "100%" },
  open: { x: 0, transition: { ...panelTransition, when: "beforeChildren" } },
};

/** Contenedor de la lista: define el stagger de sus items al abrir. */
const listVariants: Variants = {
  closed: {},
  open: { transition: { staggerChildren: 0.05, delayChildren: 0.12 } },
};

const itemVariants: Variants = {
  closed: { opacity: 0, x: 26 },
  open: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.26, ease: [0.2, 0.7, 0.3, 1] },
  },
};

/** Páginas de primer nivel del menú. Las anclas de la home van como
 *  sub-nivel de "Inicio" (ver `homeSections`). */
const PAGES: { href: string; label: string }[] = [
  { href: "/fechas", label: "Próximas fechas" },
  { href: "/archivo", label: "Calendario" },
  { href: "/experience", label: "Conocé la Experience" },
  { href: "/about", label: "About" },
];

/**
 * Panel de navegación mobile. Entra desde la derecha, cubre 86% del ancho.
 * Tratamiento zine: stickers de la forma de la Season activa de fondo,
 * acento de la Season en los estados, divisores con borde recortado y
 * apertura con stagger de los items. z-index por encima de todo el sitio.
 */
export default function MobileMenu({
  open,
  onClose,
  accent,
  forma,
  homeSections,
}: {
  open: boolean;
  onClose: () => void;
  accent: string;
  forma: Forma;
  homeSections: { href: string; label: string }[];
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
            transition={panelTransition}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Menú"
            className="fixed inset-y-0 right-0 z-[300] flex h-full w-[86%] max-w-[440px] flex-col overflow-hidden bg-paper"
            variants={panelVariants}
            initial="closed"
            animate="open"
            exit="closed"
          >
            <span aria-hidden className={styles.menuArt} style={{ "--nav-accent": accent } as CSSProperties}>
              {[0, 1, 2].map((n) => <svg key={n} viewBox="0 0 72 72">
                <path d={getShapePath(forma)} fill="none" stroke="currentColor" strokeWidth={n === 2 ? 2 : .35} />
              </svg>)}
            </span>

            <div className="relative z-10 flex h-[60px] shrink-0 items-center justify-end border-b border-line px-[clamp(18px,6vw,36px)]">
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Cerrar menú"
                className="label-mono -m-2 flex min-h-[44px] items-center gap-1.5 p-2 text-muted transition-colors hover:text-accent-1"
              >
                Cerrar
                <span aria-hidden className="text-base leading-none">
                  ✕
                </span>
              </button>
            </div>

            <motion.nav
              variants={listVariants}
              className="relative z-10 flex-1 overflow-y-auto overscroll-contain px-[clamp(20px,6vw,36px)] py-[clamp(20px,5vw,32px)]"
            >
              {/* INICIO + sub-navegación de secciones de la home */}
              <motion.div variants={itemVariants}>
                <Link
                  href="/"
                  onClick={onClose}
                  className="group flex min-h-11 items-baseline justify-between gap-3 py-3 text-[clamp(24px,6.5vw,29px)] font-extrabold uppercase leading-none tracking-tight transition-colors hover:text-accent-1"
                >
                  Inicio
                  <span
                    aria-hidden
                    className="text-[0.5em] text-accent-1 transition-transform group-hover:translate-x-1"
                  >
                    ▸
                  </span>
                </Link>
              </motion.div>

              <motion.ul
                variants={itemVariants}
                className="mb-2 mt-1 flex flex-col border-l-2 pl-4"
                style={{ borderColor: accent }}
              >
                {homeSections.map((s) => (
                  <li key={s.href}>
                    <Link
                      href={s.href}
                      onClick={onClose}
                      className="group flex min-h-[44px] items-center gap-3 py-1.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted transition-colors hover:text-ink"
                    >
                      <span
                        aria-hidden
                        className="block h-2 w-2 shrink-0 rotate-45 transition-transform group-hover:rotate-0"
                        style={{ backgroundColor: accent }}
                      />
                      {s.label}
                    </Link>
                  </li>
                ))}
              </motion.ul>

              <MenuRule />

              {/* Páginas de primer nivel */}
              {PAGES.map((p, i) => (
                <motion.div key={p.href} variants={itemVariants}>
                  <Link
                    href={p.href}
                    onClick={onClose}
                    className="group flex min-h-11 items-baseline justify-between gap-3 py-3 text-[clamp(20px,5.5vw,25px)] font-extrabold uppercase leading-tight tracking-tight transition-colors hover:text-accent-1"
                  >
                    {p.label}
                    <span
                      aria-hidden
                      className="text-[0.55em] text-accent-1 transition-transform group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </Link>
                  {i < PAGES.length - 1 && <MenuRule thin />}
                </motion.div>
              ))}
              <div className="mt-7 border-t border-line pt-5 pb-4"><InstagramLink /></div>
            </motion.nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Divisor: borde recortado (corte de cinta) levemente rotado, o una línea
 *  fina para separar los ítems de página entre sí. */
function MenuRule({ thin = false }: { thin?: boolean }) {
  return (
    <span
      aria-hidden
      className={`my-3 block w-full bg-ink/70 ${thin ? "h-px opacity-40" : "h-[3px]"}`}
      style={thin ? undefined : { clipPath: EDGES[3], transform: "rotate(-0.5deg)" }}
    />
  );
}
