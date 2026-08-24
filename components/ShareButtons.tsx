"use client";

import { useState } from "react";
import { motion } from "motion/react";
import ExternalArrow from "@/components/ExternalArrow";

/** Compartir nativo (mobile) con fallback de copiar link (desktop). */
export default function ShareButtons({
  title,
  url,
}: {
  title: string;
  url: string;
}) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // el usuario canceló el share sheet; no hacer nada
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.button
      type="button"
      onClick={share}
      initial="rest"
      whileHover="hover"
      whileFocus="hover"
      className="label-mono flex w-full items-center justify-center gap-1.5 border border-line px-4 py-3 text-center transition-colors hover:border-accent-1"
    >
      {copied ? "Link copiado" : "Compartir"}
      {!copied && <ExternalArrow />}
    </motion.button>
  );
}
