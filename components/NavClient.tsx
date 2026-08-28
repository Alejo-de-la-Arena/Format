"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import MobileMenu from "@/components/MobileMenu";
import HoverUnderline from "@/components/HoverUnderline";
import InstagramLink from "@/components/InstagramLink";
import styles from "./navigation.module.css";
import type { Forma } from "@/lib/types";

const MotionLink = motion.create(Link);

/** Anclas a las secciones de la home. Compartidas por la barra desktop y el
 *  sub-nivel "Inicio" del menú mobile. */
export const HOME_SECTIONS: { href: string; label: string }[] = [
  { href: "/#proximos", label: "Eventos" },
  { href: "/#archivo", label: "Ediciones" },
  { href: "/#experience", label: "Experience" },
  { href: "/#lab", label: "Lab" },
  // FORMAT Special: página futura, fuera de la navegación por ahora.
  // { href: "/special", label: "Special" },
];

export default function NavClient({
  accent,
  forma,
}: {
  accent: string;
  forma: Forma;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className={`sticky top-0 z-[60] bg-paper ${styles.header}`}>
      <div className={`mx-auto flex h-[64px] max-w-[1400px] items-center px-[clamp(18px,4vw,48px)] ${styles.bar}`}>
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
          {HOME_SECTIONS.map((l) => (
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

        <InstagramLink className="ml-auto" />

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
        homeSections={HOME_SECTIONS}
      />
    </nav>
  );
}
