"use client";

import Image from "next/image";
import type { Season } from "@/lib/types";
import { getSeasonColors } from "@/lib/season-colors";
import HeroBackground from "@/components/HeroBackground";
import GlitchText from "@/components/GlitchText";

/**
 * Hero: fondo halftone/SDF animado (ver HeroBackground), el wordmark FORMAT
 * grande y estático, y debajo la frase de marca con el efecto GlitchText
 * (ver components/GlitchText.tsx) en el acento de la Season.
 */
export default function Hero({ season }: { season: Season }) {
  const [accent] = getSeasonColors(season);

  return (
    <header className="relative flex h-dvh items-center justify-center overflow-hidden border-b border-line bg-paper text-center md:h-auto md:min-h-[clamp(360px,58vh,620px)] md:items-end md:justify-start md:text-left">
      <HeroBackground forma={season.forma} accent={accent} />

      <div className="relative z-[2] mx-auto w-full max-w-[1400px] px-[clamp(18px,4vw,48px)] py-[clamp(28px,4vw,52px)] md:pb-[clamp(28px,4vw,52px)] md:pt-0">
        <div
          className="relative inline-block"
          style={{ transform: "rotate(-1.5deg)" }}
        >
          {/* Wordmark FORMAT. Alto atado al mismo clamp que tenía el texto
              display, para conservar escala y composición del hero. */}
          <h1 className="m-0">
            <Image
              src="/logos/logo-format-horizontal.svg"
              alt="FORMAT"
              width={256}
              height={58}
              priority
              unoptimized
              className="h-[clamp(115px,11.5vw,140px)] w-auto"
            />
          </h1>
        </div>

        <h2 className="flex flex-col items-center gap-0.5 font-body text-[clamp(20px,6vw,42px)] font-semibold uppercase tracking-[0.08em] text-ink md:mt-5 md:items-start">
          <GlitchText accent={accent} speed={1.8}>
            Made by sound
          </GlitchText>
          <GlitchText accent={accent} speed={1.8}>
            Shaped by people
          </GlitchText>
        </h2>
      </div>
    </header>
  );
}
