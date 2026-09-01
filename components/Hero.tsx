"use client";

import Image from "next/image";
import type { Season } from "@/lib/types";
import { getSeasonColors } from "@/lib/season-colors";
import HeroBackground from "@/components/HeroBackground";
import GlitchText from "@/components/GlitchText";
import { useHomeMotion } from "@/components/home/HomeMotion";
import HomeReveal from "@/components/home/HomeReveal";

/**
 * Hero: fondo halftone/SDF animado (ver HeroBackground), el wordmark FORMAT
 * grande y estático, y debajo la frase de marca con el efecto GlitchText
 * (ver components/GlitchText.tsx) en el acento de la Season.
 */
export default function Hero({ season }: { season: Season }) {
  const [accent] = getSeasonColors(season);
  const { introOpen, ready } = useHomeMotion();

  return (
    <header className="relative flex min-h-[calc(100svh-78px)] items-center justify-center overflow-hidden border-b border-line bg-paper text-center">
      <HeroBackground forma={season.forma} accent={accent} paused={introOpen || !ready} />

      <div className="relative z-[2] mx-auto flex w-full max-w-[1400px] flex-col items-center px-[clamp(18px,4vw,48px)] py-[clamp(28px,4vw,52px)]">
        <HomeReveal><div
          className="relative inline-block"
          style={{ transform: "rotate(-1.5deg)" }}
        >
          {/* Wordmark FORMAT. Alto atado al mismo clamp que tenía el texto
              display, para conservar escala y composición del hero. */}
          <h1 className="m-0">
            <Image
              src="/logos/logo-format-horizontal.svg"
              alt="FORMAT"
              width={1812}
              height={662}
              priority
              unoptimized
              className="h-[clamp(104px,12vw,168px)] w-auto"
            />
          </h1>
        </div></HomeReveal>

        <h2 className="mt-5 flex flex-col items-center gap-0.5 font-body text-[clamp(20px,4vw,48px)] font-semibold uppercase tracking-[0.08em] text-ink">
          <GlitchText accent={accent} speed={1.8} enableOnHover>
            Made by sound
          </GlitchText>
          <GlitchText accent={accent} speed={1.8} enableOnHover>
            Shaped by people
          </GlitchText>
        </h2>
      </div>
    </header>
  );
}
