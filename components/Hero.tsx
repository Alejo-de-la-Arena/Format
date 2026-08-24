"use client";

import type { CSSProperties } from "react";
import type { Season } from "@/lib/types";
import { getSeasonColors } from "@/lib/season-colors";
import HeroBackground from "@/components/HeroBackground";
import GlitchText from "@/components/GlitchText";

const TITLE_TYPE =
  "text-[clamp(100px,15vw,180px)] font-display font-semibold leading-[0.78] tracking-[-0.05em]";

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
          style={{ transform: "rotate(-1.5deg)", "--hero-glow-accent": accent } as CSSProperties}
        >
          <h1
            className={`flex flex-row items-center md:items-start ${TITLE_TYPE}`}
            style={{ color: "color-mix(in srgb, var(--color-ink) 88%, var(--hero-glow-accent) 12%)" }}
          >
            <span className="block">FORMAT</span>
          </h1>
        </div>

        <h2 className="mt-4 flex flex-col items-center gap-0.5 font-body text-[clamp(20px,6vw,42px)] font-semibold uppercase tracking-[0.08em] text-ink md:mt-5 md:items-start">
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
