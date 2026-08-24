"use client";

import { motion } from "motion/react";

/**
 * Underline animado que crece desde la izquierda en hover/focus del padre.
 * El padre debe ser un `motion.*` con `initial="rest" whileHover="hover"`
 * y `relative` en su className.
 */
export default function HoverUnderline({ className = "" }: { className?: string }) {
  return (
    <motion.span
      aria-hidden
      className={`absolute inset-x-0 -bottom-0.5 h-px origin-left bg-current ${className}`}
      variants={{ rest: { scaleX: 0 }, hover: { scaleX: 1 } }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    />
  );
}
