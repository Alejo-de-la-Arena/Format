import type { Fecha, Season } from "@/lib/types";

export const PULSE: Season = {
  slug: "pulse",
  numero: "003",
  nombre: "PULSE",
  forma: "double-circle",
  colores: ["#E5233B", "#8B0F1D", "#FF6B6B", "#FFD1D1", "#FFFFFF"],
  concepto: "",
  fechaInicio: "2026-10-09",
  fechaFin: "2026-10-30",
  about: { relato: "", colorDescripcion: "", formaDescripcion: "" },
  // Misma frase que supabase/seeds/0021_jungle.sql completa en la base.
  intro: { text: "FEEL THE CONNECTION", motion: "expand" },
};

export const PULSE_FECHAS: Fecha[] = [9, 16, 23, 30].map((day) => ({
  seasonSlug: PULSE.slug,
  fecha: `2026-10-${String(day).padStart(2, "0")}`,
  especial: day === 9,
}));
