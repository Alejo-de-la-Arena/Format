"use client";

import Link from "next/link";
import { motion } from "motion/react";
import HoverUnderline from "@/components/HoverUnderline";
import TapeBlock from "@/components/TapeBlock";
import HoverArrow from "@/components/HoverArrow";

const MotionLink = motion.create(Link);

/** Título de sección: nombre en un TapeBlock + link opcional. */
export default function SectionTitle({
  title,
  moreHref,
  moreLabel = "Ver todos",
  dark = false,
}: {
  title: string;
  moreHref?: string;
  moreLabel?: string;
  /** true en la banda ink (fondo ya oscuro): el bloque se invierte a papel/ink. */
  dark?: boolean;
}) {
  return (
    <div className="mb-7 flex items-center gap-4">
      <TapeBlock
        as="h2"
        edge={1}
        rotate={-1.2}
        invert={dark}
        className="text-[clamp(18px,2.6vw,28px)] font-black uppercase tracking-tight"
      >
        {title}
      </TapeBlock>
      {moreHref && (
        <MotionLink
          href={moreHref}
          initial="rest"
          whileHover="hover"
          whileFocus="hover"
          className={`label-mono relative ml-auto inline-flex w-fit items-center gap-2 transition-colors hover:text-accent-1 ${
            dark ? "text-paper/70" : "text-muted"
          }`}
        >
          {moreLabel}
          <HoverArrow />
          <HoverUnderline />
        </MotionLink>
      )}
    </div>
  );
}
