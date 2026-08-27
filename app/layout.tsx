import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { MotionConfig } from "motion/react";
import { getActiveSeason } from "@/lib/data/seasons";
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
  const activeSeason = await getActiveSeason();

  return (
    <html lang="es" className={inter.variable}>
      <body
        className="overflow-x-hidden bg-paper font-body text-ink antialiased"
        style={seasonAccentVars(activeSeason)}
      >
        <div className="grain" aria-hidden />
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </body>
    </html>
  );
}
