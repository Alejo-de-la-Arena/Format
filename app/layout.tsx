import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { MotionConfig } from "motion/react";
import { getActiveSeason, getSeasons } from "@/lib/data/seasons";
import HomeMotion from "@/components/home/HomeMotion";
import { getIntroSeasons, introCopy } from "@/lib/season-intro";
import { getSeasonColors } from "@/lib/season-colors";
import type { Season } from "@/lib/types";
import { seasonAccentVars } from "@/lib/theme";
import "./globals.css";

// Tipografía: sólo Inter. El wordmark FORMAT (hero, header, footer) va como
// SVG vectorizado en public/logos/ — no se sirve ninguna webfont display.

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FORMAT — Av. Costanera Rafael Obligado 4801 · Buenos Aires",
  description:
    "Electrónica en Av. Costanera Rafael Obligado 4801, Buenos Aires. Próximos eventos y archivo de ediciones.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [activeSeason, seasons] = await Promise.all([getActiveSeason(), getSeasons()]);
  const { current, previous } = getIntroSeasons(seasons);
  const identity = (season: Season | null) => season ? {
    slug: season.slug, fechaInicio: season.fechaInicio, numero: season.numero,
    nombre: season.nombre, forma: season.forma, color: getSeasonColors(season)[0],
    text: introCopy(season), motion: season.intro?.motion ?? "signal" as const,
  } : null;

  return (
    <html lang="es" className={inter.variable} data-scroll-behavior="smooth">
      <body
        className="overflow-x-hidden bg-paper font-body text-ink antialiased"
        style={seasonAccentVars(activeSeason)}
      >
        <div className="grain" aria-hidden />
        <MotionConfig reducedMotion="user">
          <HomeMotion current={identity(current)} previous={identity(previous)}>{children}</HomeMotion>
        </MotionConfig>
      </body>
    </html>
  );
}
