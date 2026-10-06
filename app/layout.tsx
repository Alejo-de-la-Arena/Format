import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { MotionConfig } from "motion/react";
import { getActiveSeason } from "@/lib/data/seasons";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next'
import HomeMotion from "@/components/home/HomeMotion";
import { introStorageKey } from "@/lib/season-intro";
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
  icons: {
    icon: [{ url: "/logos/logo-format-columna.svg", type: "image/svg+xml", sizes: "any" }],
    shortcut: ["/logos/logo-format-columna.svg"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const activeSeason = await getActiveSeason();
  const current = activeSeason;
  const identity = (season: Season | null) => season ? {
    slug: season.slug, fechaInicio: season.fechaInicio, numero: season.numero,
    nombre: season.nombre, forma: season.forma, color: getSeasonColors(season)[0],
    text: season.intro?.text.trim() ?? "", motion: season.intro?.motion ?? "signal" as const,
  } : null;
  // Corre antes del primer paint. Sólo tapa una visita que el cliente también
  // va a convertir en intro; las visitas ya recordadas no reciben el flag.
  const preflightScript = current
    ? `(()=>{const r=${JSON.stringify(current.slug === "pulse")};try{const k=${JSON.stringify(introStorageKey(current)).replace(/</g, "\\u003c")};const n=performance.getEntriesByType("navigation")[0];if(!location.pathname.startsWith("/admin")&&(r||!matchMedia("(prefers-reduced-motion: reduce)").matches)&&sessionStorage.getItem(k)!=="1"&&n?.type!=="back_forward")document.documentElement.dataset.introPreflight=""}catch{if(!location.pathname.startsWith("/admin")&&(r||!matchMedia("(prefers-reduced-motion: reduce)").matches))document.documentElement.dataset.introPreflight=""}})()`
    : "";

  return (
    <html lang="es" className={inter.variable} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {preflightScript && <script dangerouslySetInnerHTML={{ __html: preflightScript }} />}
      </head>
      <body
        suppressHydrationWarning
        className="overflow-x-hidden bg-paper font-body text-ink antialiased"
        style={seasonAccentVars(activeSeason)}
      >
        <div className="grain" aria-hidden />
        <MotionConfig reducedMotion="user">
          <HomeMotion current={identity(current)}>{children}</HomeMotion>
        </MotionConfig>
        {process.env.VERCEL === "1" && <Analytics />}
        {process.env.VERCEL === "1" && <SpeedInsights />}
      </body>
    </html>
  );
}
