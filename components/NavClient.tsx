"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import MobileMenu from "@/components/MobileMenu";
import HoverUnderline from "@/components/HoverUnderline";
import MusicControls from "@/components/MusicControls";
import { getShapePath } from "@/components/shapePaths";
import styles from "./navigation.module.css";
import type { Forma } from "@/lib/types";

const MotionLink = motion.create(Link);

/** Páginas reales disponibles en la navegación principal. */
const PAGE_LINKS: { href: string; label: string }[] = [
  { href: "/", label: "Inicio" },
  { href: "/proximas-fechas", label: "Próximas fechas" },
  { href: "/calendario", label: "Calendario" },
  { href: "/experience", label: "Conocé la Experience" },
  { href: "/about", label: "Qué es FORMAT" },
  // FORMAT Special: página futura, fuera de la navegación por ahora.
  // { href: "/special", label: "Special" },
];

export default function NavClient({
  accent,
  forma,
  seasonName,
}: {
  accent: string;
  forma: Forma;
  seasonName: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div aria-hidden className="h-[78px] shrink-0" />
      <nav
        className={`inset-x-0 top-0 z-[60] overflow-hidden bg-paper ${styles.header}`}
        style={{ "--header-accent": accent } as CSSProperties}
      >
      <span className={styles.headerBackdrop} aria-hidden>
        <svg viewBox="0 0 72 72"><path d={getShapePath(forma)} /></svg>
        <svg viewBox="0 0 72 72"><path d={getShapePath(forma, "header-offset")} /></svg>
        <svg viewBox="0 0 72 72"><path d={getShapePath(forma, "header-stamp")} /></svg>
      </span>
      <div className={`relative z-10 mx-auto flex h-[78px] max-w-[1400px] items-center px-[clamp(18px,4vw,48px)] ${styles.bar}`}>
        <Link href="/" className="flex items-center" aria-label="FORMAT — inicio">
          {/* Logo apilado FOR/MAT. Alto fijado al del wordmark tipográfico
              anterior (text-xl · leading-[0.78], ~34px en dos líneas). */}
          <Image
            src="/logos/logo-format-columna.svg"
            alt="FORMAT"
            width={150}
            height={100}
            priority
            unoptimized
            className="h-[50px] w-auto"
          />
        </Link>
        <div className="hidden gap-7 md:flex">
          {PAGE_LINKS.map((l) => (
            <MotionLink
              key={l.href}
              href={l.href}
              initial="rest"
              whileHover="hover"
              whileFocus="hover"
              className="relative inline-block w-fit text-sm font-semibold text-muted transition-colors hover:text-ink"
            >
              {l.label}
              <HoverUnderline />
            </MotionLink>
          ))}
        </div>

        <div className={styles.seasonTicker} aria-label={`Season actual: ${seasonName}`}>
          <span className={styles.seasonTickerKicker}>Season actual</span>
          <strong>{seasonName}</strong>
          <span className={styles.seasonTickerMeta}>BA · Viernes</span>
        </div>

        <MusicControls />

        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
          className={styles.menuButton}
        >
          <span className="h-[1.5px] w-6 bg-ink" />
          <span className="h-[1.5px] w-4 bg-ink" />
        </button>
      </div>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        accent={accent}
        forma={forma}
      />
      </nav>
    </>
  );
}
