"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import MobileMenu from "@/components/MobileMenu";
import ExternalArrow from "@/components/ExternalArrow";
import HoverUnderline from "@/components/HoverUnderline";
import { EXTERNAL_LINK, SOCIAL } from "@/lib/social";

const MotionLink = motion.create(Link);

const links = [
  { href: "/#proximos", label: "Eventos" },
  { href: "/#archivo", label: "Ediciones" },
  { href: "/#experience", label: "Experience" },
  { href: "/#lab", label: "Lab" },
  // FORMAT Special: página futura, fuera de la navegación por ahora.
  // { href: "/special", label: "Special" },
];

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-[60] border-b border-line bg-paper">
      <div className="mx-auto flex h-[60px] max-w-[1400px] items-center gap-9 px-[clamp(18px,4vw,48px)]">
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
          {links.map((l) => (
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
        <motion.a
          href={SOCIAL.instagram}
          {...EXTERNAL_LINK}
          initial="rest"
          whileHover="hover"
          whileFocus="hover"
          className="label-mono ml-auto flex items-center gap-1 rounded-xs border border-line px-3 py-2 !tracking-[0.12em] transition-colors hover:border-accent-1"
        >
          Instagram
          <ExternalArrow />
        </motion.a>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
          className="flex h-9 w-9 flex-col items-end justify-center gap-[5px] md:hidden"
        >
          <span className="h-[1.5px] w-6 bg-ink" />
          <span className="h-[1.5px] w-4 bg-ink" />
        </button>
      </div>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} links={links} />
    </nav>
  );
}
