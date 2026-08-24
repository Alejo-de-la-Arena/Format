"use client";

import { motion } from "motion/react";
import type { ComponentProps } from "react";

/**
 * Anchor externo con estado de hover/focus expuesto a hijos vía variants
 * (usar junto a ExternalArrow).
 */
export default function HoverAnchor(props: ComponentProps<typeof motion.a>) {
  return <motion.a initial="rest" whileHover="hover" whileFocus="hover" {...props} />;
}
