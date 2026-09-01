"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import ExternalArrow from "@/components/ExternalArrow";
import HoverUnderline from "@/components/HoverUnderline";
import { EXTERNAL_LINK, SOCIAL } from "@/lib/social";

const MotionLink = motion.create(Link);

const EXPLORAR: [string, string][] = [
  ["Eventos", "/#proximos"],
  ["Ediciones", "/#archivo"],
  ["Lab", "/#lab"],
];

const SEGUINOS: [string, string][] = [
  ["Instagram", SOCIAL.instagram],
  ["SoundCloud", SOCIAL.soundcloud],
  ["YouTube", SOCIAL.youtube],
];

/** Cabecera de columna: etiqueta chica en mayúsculas, sin bloque de cinta —
 *  el footer no usa el tratamiento tipográfico de los títulos del sitio. */
const headingClass =
  "mb-4 block text-[10px] font-bold uppercase tracking-[0.22em] text-paper/60";

const linkClass =
  "relative block w-fit text-[15px] font-medium leading-tight text-paper/75 transition-colors hover:text-paper";

/**
 * Footer: fondo plano en negro, sin trama ni grano. Es el único bloque
 * sólido del sitio y funciona como contratapa — corta la página en seco
 * contra el papel de la sección anterior, con una regla en el acento de la
 * Season activa marcando el borde.
 *
 * Deliberadamente más sobrio que el resto: la jerarquía la hacen el peso y
 * la opacidad del texto, no las cintas negras de los títulos. El único gesto
 * gráfico es el wordmark abajo, con su subrayado en el acento.
 *
 * El color sale de --accent-1 (Season activa, o la propia en
 * /eventos/[slug]): el componente no recibe props y sigue el theming solo.
 */
export default function Footer() {
  return (
    <footer className="bg-ink text-paper">
      {/* Borde superior en el acento: hace intencional el corte contra el
          papel de la sección de arriba. */}
      <div aria-hidden className="h-[3px] w-full bg-accent-1" />

      <div className="mx-auto max-w-[1400px] px-[clamp(18px,4vw,48px)] pb-[clamp(28px,4vw,44px)] pt-[clamp(40px,5vw,72px)]">
        <div className="grid grid-cols-2 gap-x-[clamp(20px,4vw,56px)] gap-y-[clamp(30px,4vw,44px)] md:grid-cols-4">
          <div>
            <b className={headingClass}>Dónde</b>
            <span className="block max-w-[22ch] text-[15px] font-medium leading-snug text-paper/75">
              Av. Costanera Rafael Obligado 4801
            </span>
            <span className="mt-1.5 block text-[15px] font-medium text-paper/60">
              Buenos Aires
            </span>
          </div>

          <div>
            <b className={headingClass}>Explorar</b>
            <div className="flex flex-col gap-2.5">
              {EXPLORAR.map(([label, href]) => (
                <MotionLink
                  key={label}
                  href={href}
                  initial="rest"
                  whileHover="hover"
                  whileFocus="hover"
                  className={linkClass}
                >
                  {label}
                  <HoverUnderline />
                </MotionLink>
              ))}
            </div>
          </div>

          <div>
            <b className={headingClass}>Seguinos</b>
            <div className="flex flex-col gap-2.5">
              {SEGUINOS.map(([label, href]) => (
                <motion.a
                  key={label}
                  href={href}
                  {...EXTERNAL_LINK}
                  initial="rest"
                  whileHover="hover"
                  whileFocus="hover"
                  className={`${linkClass} flex items-center gap-1`}
                >
                  {label}
                  <ExternalArrow />
                </motion.a>
              ))}
            </div>
          </div>

          <div>
            <b className={headingClass}>Contacto</b>
            <MotionLink
              href="mailto:bookings@format.com"
              initial="rest"
              whileHover="hover"
              whileFocus="hover"
              className={linkClass}
            >
              Bookings
              <HoverUnderline />
            </MotionLink>
          </div>
        </div>

        {/* Wordmark: pieza gráfica, con el subrayado como elemento aparte
            debajo — así nunca recorta las letras. El font-size vive en el
            contenedor para que tanto el logo (alto en `em`) como el subrayado
            escalen juntos en cualquier viewport. `brightness-0 invert` deja el
            SVG en blanco sólido sobre el negro del footer. */}
        <div className="mt-[clamp(38px,5vw,68px)] border-t border-paper/12 pt-[clamp(22px,3vw,38px)] text-[clamp(48px,11vw,158px)]">
          <div className="flex items-end justify-between gap-4">
            <Image
              src="/logos/logo-format-horizontal.svg"
              alt="FORMAT"
              width={256}
              height={58}
              unoptimized
              className="block h-[0.82em] w-auto select-none brightness-0 invert"
            />
            <span className="label-mono shrink-0 text-[10px] text-paper/45">
              Desarrollado por ADLA
            </span>
          </div>
          <span
            aria-hidden
            className="mt-[0.08em] block h-[max(3px,0.045em)] w-full bg-accent-1"
          />
        </div>
      </div>
    </footer>
  );
}
