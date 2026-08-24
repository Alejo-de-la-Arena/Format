"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { ComponentProps } from "react";

const Motion = motion.create(Link);

/**
 * Link interno con estado de hover/focus expuesto a hijos vía variants
 * (usar junto a HoverArrow / HoverUnderline).
 */
export default function HoverLink(props: ComponentProps<typeof Motion>) {
  return <Motion initial="rest" whileHover="hover" whileFocus="hover" {...props} />;
}
