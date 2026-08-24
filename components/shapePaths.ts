import type { Forma } from "@/lib/types";
import { hashSeed, mulberry32 } from "@/lib/rng";

/**
 * Geometría cruda (sin jitter) de cada forma de Season, viewBox 0 0 72 72.
 * Fuente única compartida por Glyph (stroke, línea fina) y como base de
 * getShapePath. Se mantiene exportada para no romper consumidores directos.
 */
export const SHAPE_PATHS: Record<Forma, string> = {
  circle: "M36 8 A28 28 0 1 1 35.99 8 Z",
  triangle: "M36 8 L64 62 L8 62 Z",
  square: "M10 10 H62 V62 H10 Z",
  hexagon: "M36 8 L60.25 22 L60.25 50 L36 64 L11.75 50 L11.75 22 Z",
  "hexagon-organic":
    "M36 14 Q50 14 56 24 Q62 34 56 44 Q50 54 36 58 Q22 54 16 44 Q10 34 16 24 Q22 14 36 14 Z",
  infinity:
    "M20 36 C20 24 34 24 36 36 C38 48 52 48 52 36 C52 24 38 24 36 36 C34 48 20 48 20 36 Z",
  cross:
    "M21.15 8.42 L63.58 50.85 L50.85 63.58 L8.42 21.15 Z M8.42 50.85 L50.85 8.42 L63.58 21.15 L21.15 63.58 Z",
};

type Point = { x: number; y: number };

/** Vértices "ideales" de cada forma poligonal, antes de aplicar jitter. */
const POLY_VERTICES: Partial<Record<Forma, Point[]>> = {
  square: [
    { x: 10, y: 10 },
    { x: 62, y: 10 },
    { x: 62, y: 62 },
    { x: 10, y: 62 },
  ],
  triangle: [
    { x: 36, y: 8 },
    { x: 64, y: 62 },
    { x: 8, y: 62 },
  ],
  hexagon: [
    { x: 36, y: 8 },
    { x: 60.25, y: 22 },
    { x: 60.25, y: 50 },
    { x: 36, y: 64 },
    { x: 11.75, y: 50 },
    { x: 11.75, y: 22 },
  ],
  "hexagon-organic": [
    { x: 56, y: 24 },
    { x: 56, y: 44 },
    { x: 36, y: 58 },
    { x: 16, y: 44 },
    { x: 16, y: 24 },
    { x: 36, y: 14 },
  ],
};

const CIRCLE = { cx: 36, cy: 36, r: 28, points: 14 };

/** Jitter máximo por forma (unidades de viewBox), chico a propósito —
 * silueta reconocible, no una forma nueva. */
const JITTER_AMOUNT: Record<Forma, number> = {
  square: 2.4,
  triangle: 2,
  hexagon: 2,
  "hexagon-organic": 2.6,
  circle: 2.2,
  infinity: 0,
  // Dos barras cruzadas — sin vértices claros para deformar sin desarmar
  // el cruce, igual que infinity.
  cross: 0,
};

function jitterPoints(points: Point[], rng: () => number, amount: number): Point[] {
  return points.map((p) => ({
    x: p.x + (rng() * 2 - 1) * amount,
    y: p.y + (rng() * 2 - 1) * amount,
  }));
}

function straightPath(points: Point[]): string {
  const [first, ...rest] = points;
  return (
    `M ${first.x.toFixed(2)} ${first.y.toFixed(2)} ` +
    rest.map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ") +
    " Z"
  );
}

/** Curva cerrada suave a través de los puntos: cada punto es el control de
 * una cuadrática hacia el punto medio del siguiente segmento. El círculo y
 * el hexágono orgánico ya son trazos "a mano" — así el jitter los deforma
 * sin volverlos poligonales. */
function smoothClosedPath(points: Point[]): string {
  const mid = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const n = points.length;
  const start = mid(points[n - 1], points[0]);
  let d = `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} `;
  for (let i = 0; i < n; i++) {
    const curr = points[i];
    const next = points[(i + 1) % n];
    const m = mid(curr, next);
    d += `Q ${curr.x.toFixed(2)} ${curr.y.toFixed(2)} ${m.x.toFixed(2)} ${m.y.toFixed(2)} `;
  }
  return d + "Z";
}

function circlePoints(rng: () => number, amount: number): Point[] {
  const { cx, cy, r, points } = CIRCLE;
  return Array.from({ length: points }, (_, i) => {
    const angle = (i / points) * Math.PI * 2;
    const jitteredR = r + (rng() * 2 - 1) * amount;
    return {
      x: cx + Math.cos(angle) * jitteredR,
      y: cy + Math.sin(angle) * jitteredR,
    };
  });
}

/**
 * Path SVG de la forma de Season con jitter leve y determinístico: misma
 * `seed` da siempre el mismo resultado (nada de Math.random ni mismatch de
 * hidratación), `seed` distinta varía la silueta sin perder su identidad.
 * Sin `seed`, cae a un jitter fijo por forma (misma forma sin variar).
 * `infinity` son dos lazos cruzados — no tiene vértices claros para
 * deformar sin arriesgar la silueta, así que queda sin jitter.
 */
export function getShapePath(forma: Forma, seed: string | number = forma): string {
  const amount = JITTER_AMOUNT[forma];
  if (amount === 0) return SHAPE_PATHS[forma];

  const rng = mulberry32(hashSeed(`${forma}:${seed}`));

  if (forma === "circle") {
    return smoothClosedPath(circlePoints(rng, amount));
  }

  const vertices = POLY_VERTICES[forma];
  if (!vertices) return SHAPE_PATHS[forma];

  const jittered = jitterPoints(vertices, rng, amount);
  return forma === "hexagon-organic" ? smoothClosedPath(jittered) : straightPath(jittered);
}
