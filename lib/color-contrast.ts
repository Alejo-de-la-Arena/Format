/** Gris papel del sistema (--color-paper en app/globals.css). */
export const PAPER = "#C8D0D2";

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
