"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { ComponentProps } from "react";

const Motion = motion.create(Link);

/** CTA primario: invierte fondo/texto en hover/focus. */
export default function InvertLink(props: ComponentProps<typeof Motion>) {
  return (
    <Motion
      initial={{ backgroundColor: "#000000", color: "#ffffff" }}
      whileHover={{ backgroundColor: "#ffffff", color: "#000000" }}
      whileFocus={{ backgroundColor: "#ffffff", color: "#000000" }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      {...props}
    />
  );
}
