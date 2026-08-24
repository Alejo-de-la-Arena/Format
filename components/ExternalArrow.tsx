"use client";

import { motion } from "motion/react";

/**
 * Flecha diagonal que se anima sola en hover/focus del elemento padre.
 * El padre debe ser un `motion.*` con `initial="rest" whileHover="hover"`.
 */
export default function ExternalArrow({ className = "" }: { className?: string }) {
  return (
    <motion.span
      aria-hidden
      className={`inline-block ${className}`}
      variants={{ rest: { x: 0, y: 0 }, hover: { x: 2, y: -2 } }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      ↗
    </motion.span>
  );
}
