import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
import localFont from "next/font/local";
import { MotionConfig } from "motion/react";
import { getActiveSeason } from "@/lib/data/seasons";
import { seasonAccentVars } from "@/lib/theme";
import "./globals.css";

// TODO: DEMO de uso personal (licencia 1001fonts FFP) — todavía no tenemos
// la licencia comercial de CS Miska del diseñador original. Sirve sólo
// como preview local. REEMPLAZAR por la versión con licencia comercial
// antes de cualquier deploy a producción.
const csMiska = localFont({
  src: "../public/fonts/local-preview/CSMiska-Regular_demo.otf",
  variable: "--font-cs-miska",
  weight: "400",
  display: "swap",
});

// Fallback de --font-display en la cadena de fuentes mientras se resuelve
// la licencia comercial de CS Miska — ver app/globals.css § --font-display.
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-archivo",
  display: "swap",
});

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
    <html
      lang="es"
      className={`${csMiska.variable} ${archivo.variable} ${inter.variable}`}
    >
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
