import type { Forma } from "@/lib/types";

/**
 * Secuencia completa de Seasons para la pieza "Qué es FORMAT" — forma,
 * paleta, número y nombre de cada una en orden. Origin es la única Season
 * real (Supabase); las siguientes cuatro son constantes de UI hasta que
 * existan de verdad en /admin.
 *
 * Ojo: estos colores son LOCALES a esa sección. No tocan --accent-1..5 ni
 * el theming por Season del resto del sitio (ver lib/theme.ts) — la home
 * sigue en el azul de Origin mientras la pieza cicla por los otros.
 *
 * `colores` respeta el orden de roles del resto del sitio:
 * [0] principal · [1] secundario · [2] gradiente/glow · [3] detalle ·
 * [4] highlight. La pieza usa [0] para la silueta y [3] como tinte de fondo.
 */
export interface SeasonSequenceItem {
  numero: string;
  nombre: string;
  forma: Forma;
  colores: [string, string, string, string, string];
  /** Ángulo de reposo del sticker, en grados. Distinto por Season para que
   *  cada una quede "pegada a mano" en vez de alineada a la grilla. */
  tilt: number;
}

export const SEASON_SEQUENCE: SeasonSequenceItem[] = [
  {
    numero: "001",
    nombre: "Origin",
    forma: "square",
    colores: ["#1E38F5", "#0E1A6B", "#5B72FF", "#B8C7FF", "#FFFFFF"],
    tilt: -4,
  },
  {
    numero: "002",
    nombre: "Ascent",
    forma: "triangle",
    colores: ["#7B3FE4", "#4C1D95", "#A78BFA", "#DDD6FE", "#FFFFFF"],
    tilt: 3,
  },
  {
    numero: "003",
    nombre: "Pulse",
    forma: "cross",
    colores: ["#E5233B", "#8B0F1D", "#FF6B6B", "#FFD1D1", "#FFFFFF"],
    tilt: -2,
  },
  {
    numero: "004",
    nombre: "Jungle",
    forma: "hexagon",
    colores: ["#16A34A", "#14532D", "#4ADE80", "#BBF7D0", "#FFFFFF"],
    tilt: 5,
  },
  {
    numero: "005",
    nombre: "Eclipse",
    forma: "circle",
    colores: ["#F5B324", "#E88A0C", "#FDE68A", "#FEF3C7", "#FFFFFF"],
    tilt: -3,
  },
];
