"use client";

import Link from "next/link";
import { motion } from "motion/react";
import ExternalArrow from "@/components/ExternalArrow";
import HoverUnderline from "@/components/HoverUnderline";

const MotionLink = motion.create(Link);

export default function Footer() {
  return (
    <footer className="border-t border-line py-11">
      <div className="mx-auto flex max-w-[1400px] flex-wrap justify-between gap-7 px-[clamp(18px,4vw,48px)]">
        <div>
          <b className="mb-2.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
            Dónde
          </b>
          <span className="mb-1.5 block text-sm text-muted">
            Av. Costanera Rafael Obligado 4801
          </span>
          <span className="mb-1.5 block text-sm text-muted">
            Buenos Aires
          </span>
        </div>
        <div>
          <b className="mb-2.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
            Explorar
          </b>
          {[
            ["Eventos", "/#proximos"],
            ["Ediciones", "/#archivo"],
            ["Lab", "/#lab"],
          ].map(([label, href]) => (
            <MotionLink
              key={label}
              href={href}
              initial="rest"
              whileHover="hover"
              whileFocus="hover"
              className="relative mb-1.5 block w-fit text-sm text-muted hover:text-accent-1"
            >
              {label}
              <HoverUnderline />
            </MotionLink>
          ))}
        </div>
        <div>
          <b className="mb-2.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
            Seguinos
          </b>
          {[
            ["Instagram", "https://instagram.com"],
            ["SoundCloud", "https://soundcloud.com"],
            ["YouTube", "https://youtube.com"],
          ].map(([label, href]) => (
            <motion.a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              initial="rest"
              whileHover="hover"
              whileFocus="hover"
              className="mb-1.5 flex w-fit items-center gap-1 text-sm text-muted hover:text-accent-1"
            >
              {label}
              <ExternalArrow />
            </motion.a>
          ))}
        </div>
        <div>
          <b className="mb-2.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
            Contacto
          </b>
          <MotionLink
            href="mailto:bookings@format.com"
            initial="rest"
            whileHover="hover"
            whileFocus="hover"
            className="relative mb-1.5 block w-fit text-sm text-muted hover:text-accent-1"
          >
            Bookings
            <HoverUnderline />
          </MotionLink>
        </div>
      </div>
    </footer>
  );
}
