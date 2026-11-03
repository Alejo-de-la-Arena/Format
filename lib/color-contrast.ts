/** Gris papel y tinta del sistema (--color-paper / --color-ink en app/globals.css). */
export const PAPER = "#C8D0D2";
export const INK = "#111111";

/** Contraste mínimo para líneas y elementos gráficos (WCAG 1.4.11). */
export const MIN_GRAPHIC_CONTRAST = 3;

/** #RGB → #RRGGBB; el alfa (#RRGGBBAA) se ignora. */
function expand(hex: string): string {
  return /^#[0-9a-f]{3}$/i.test(hex) ? `#${[...hex.slice(1)].map((c) => c + c).join("")}` : hex;
}

function luminance(hex: string): number {
  const full = expand(hex);
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(full.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Relación de contraste WCAG entre dos hex #RRGGBB (1 a 21). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Regla del rol 3 (CLAUDE.md § Colores por Season): nunca como texto ni línea
 * sobre papel si no contrasta. Todo uso del rol 3 como texto/línea sobre
 * papel pasa por acá (hoy el rol 3 sólo se usa en glows y gradientes).
 *
 * Color para texto o líneas sobre un fondo: el preferido si contrasta lo
 * suficiente; si no, el principal de la Season. Ej.: el verde ácido de
 * Jungle (#3DFF5C, 1.17:1 sobre papel) cae al principal. Sobre negro, en
 * glows y destellos, se sigue usando el color original.
 */
export function readableOn(background: string, preferred: string, principal: string): string {
  return contrastRatio(preferred, background) >= MIN_GRAPHIC_CONTRAST ? preferred : principal;
}

/**
 * Color de TEXTO sobre un fondo de acento: papel o tinta, el que más
 * contraste. Ej.: sobre el verde de Jungle o el rojo de Pulse gana la tinta;
 * sobre el azul de Origin, el papel.
 */
export function readableTextOn(background: string): typeof PAPER | typeof INK {
  return contrastRatio(INK, background) >= contrastRatio(PAPER, background) ? INK : PAPER;
}

/**
 * Glow (rol 3) sobre papel. Si el rol 3 no contrasta 3:1 contra el papel
 * (el verde ácido de Jungle), se tiñe hacia el principal (35 % / 65 %) y baja
 * de intensidad; el ácido puro queda para fondos negros. `pct(55)` escala el
 * porcentaje de mezcla que usa cada glow.
 */
export function paperGlow(glow: string, principal: string): { color: string; pct: (base: number) => number } {
  if (contrastRatio(glow, PAPER) >= MIN_GRAPHIC_CONTRAST) return { color: glow, pct: (base) => base };
  return { color: `color-mix(in srgb, ${glow} 35%, ${principal})`, pct: (base) => Math.round(base * 0.6) };
}
