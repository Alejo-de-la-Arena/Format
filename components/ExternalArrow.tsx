"use client";

import { motion } from "motion/react";
import ActionIcon from "@/components/ActionIcon";

/**
 * Indicador de enlace externo, dibujado en SVG para evitar emojis del sistema.
 * El padre debe ser un `motion.*` con `initial="rest" whileHover="hover"`.
 */
export default function ExternalArrow({ className = "" }: { className?: string }) {
  return (
    <motion.span
      aria-hidden
      className={`inline-flex items-center ${className}`}
      variants={{ rest: { x: 0, y: 0 }, hover: { x: 2, y: -2 } }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <ActionIcon kind="external" />
    </motion.span>
  );
}
