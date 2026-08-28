"use client";

import { motion } from "motion/react";
import ActionIcon from "@/components/ActionIcon";

/**
 * Flecha "→" (navegación interna) que se desplaza en hover/focus del padre.
 * El padre debe ser un `motion.*` con `initial="rest" whileHover="hover"`.
 */
export default function HoverArrow({ className = "" }: { className?: string }) {
  return (
    <motion.span
      aria-hidden
      className={`inline-flex items-center ${className}`}
      variants={{ rest: { x: 0 }, hover: { x: 3 } }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <ActionIcon />
    </motion.span>
  );
}
