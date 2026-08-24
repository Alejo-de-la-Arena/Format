import type { Forma } from "@/lib/types";
import { hashSeed, mulberry32 } from "@/lib/rng";

/**
 * Morph entre las siluetas de Season sin librerías externas.
 *
 * La idea: muestrear las 5 formas a la MISMA cantidad de puntos (64), todas
 * centradas en el mismo origen y con el mismo radio, de modo que el punto i
 * de una forma corresponda al punto i de la otra. Con esa correspondencia,
 * interpolar es un lerp por punto y el path resultante es válido en todo
 * momento.
 *
 * Muestreo ANGULAR (radio por ángulo fijo), no por longitud de arco: los 64
 * ángulos son los mismos para las 5 formas, así el punto i sale siempre en
 * la misma dirección desde el centro y el morph es una expansión/contracción
 * puramente radial — nunca rota ni se retuerce. En el cuadrado eso da además
 * exactamente 16 puntos por lado (cada lado subtiende 90°). Muestrear por
 * longitud de arco alinearía "fracción de perímetro" en vez de ángulo y haría
 * que las esquinas se deslicen entre formas.
 *
 * Todo lo pesado se precalcula al importar el módulo: por frame sólo quedan
 * 64 lerps y un join de string.
 */

/** Puntos por silueta. Igual para las 5 — es lo que hace interpolable el path. */
export const MORPH_POINTS = 64;

/** viewBox compartido con el resto de las formas del sitio (0 0 72 72). */
export const MORPH_VIEWBOX = 72;

const CX = 36;
const CY = 36;
/** Radio circunscripto común: el vértice más lejano de cada forma cae acá. */
const R = 28;

/** Amplitud del borde irregular, en unidades de viewBox (~2.5% de R). */
const JITTER_AMOUNT = 0.7;
/** Puntos de control del jitter: pocos y suavizados → borde ondulado como
 *  recortado a mano, no ruido punto a punto tipo estática. */
const JITTER_CONTROLS = 10;

interface Point {
  x: number;
  y: number;
}

function polar(angleDeg: number, r: number): Point {
  const a = (angleDeg * Math.PI) / 180;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r };
}

/** Polígono regular de `sides` lados con los vértices sobre el radio R. */
function regular(sides: number, startDeg: number): Point[] {
  return Array.from({ length: sides }, (_, i) =>
    polar(startDeg + (360 / sides) * i, R),
  );
}

/** Escala el polígono para que su vértice más lejano quede exactamente en R. */
function scaleToRadius(points: Point[]): Point[] {
  const max = Math.max(...points.map((p) => Math.hypot(p.x, p.y)));
  const k = R / max;
  return points.map((p) => ({ x: p.x * k, y: p.y * k }));
}

function rotate(points: Point[], deg: number): Point[] {
  const a = (deg * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  return points.map((p) => ({
    x: p.x * cos - p.y * sin,
    y: p.x * sin + p.y * cos,
  }));
}

/** La X: polígono de 12 vértices (una cruz) rotada 45°. */
function crossVertices(): Point[] {
  const w = 0.3; // semi-ancho del brazo, relativo al largo
  const l = 1;
  const plus: Point[] = [
    { x: -w, y: -l },
    { x: w, y: -l },
    { x: w, y: -w },
    { x: l, y: -w },
    { x: l, y: w },
    { x: w, y: w },
    { x: w, y: l },
    { x: -w, y: l },
    { x: -w, y: w },
    { x: -l, y: w },
    { x: -l, y: -w },
    { x: -w, y: -w },
  ];
  return scaleToRadius(rotate(plus, 45));
}

/**
 * Vértices de cada silueta, centrados en el origen. -90° es arriba, así que
 * triángulo y hexágono quedan en punta hacia arriba y el cuadrado alineado a
 * los ejes — igual que las formas de components/shapePaths.ts.
 * El círculo no lleva vértices: su radio es R en todos los ángulos.
 */
const VERTICES: Partial<Record<Forma, Point[]>> = {
  square: regular(4, -45),
  triangle: regular(3, -90),
  hexagon: regular(6, -90),
  cross: crossVertices(),
};

/**
 * Distancia del centro al borde del polígono en un ángulo dado. Las 5 formas
 * son star-shaped respecto del centro (todo rayo corta el borde una sola
 * vez), así que esto está bien definido para todas, incluida la X.
 */
function radiusAtAngle(verts: Point[], angleDeg: number): number {
  const a = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  let hit = 0;

  for (let i = 0; i < verts.length; i++) {
    const p1 = verts[i];
    const p2 = verts[(i + 1) % verts.length];
    const ex = p2.x - p1.x;
    const ey = p2.y - p1.y;
    const den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-9) continue; // rayo paralelo al lado

    const t = (p1.x * ey - p1.y * ex) / den; // distancia sobre el rayo
    const u = (p1.x * dy - p1.y * dx) / den; // posición sobre el lado, 0..1
    if (t >= 0 && u >= -1e-9 && u <= 1 + 1e-9) hit = Math.max(hit, t);
  }

  return hit;
}

/** Direcciones unitarias de los 64 ángulos de muestreo, compartidas. */
const DIRS: Point[] = Array.from({ length: MORPH_POINTS }, (_, i) =>
  polar(-90 + (360 / MORPH_POINTS) * i, 1),
);

/**
 * Ruido suave y cíclico alrededor del perímetro: `JITTER_CONTROLS` valores
 * aleatorios interpolados con coseno, para que el offset del punto 63 empalme
 * con el del 0 y el contorno cierre sin escalón.
 */
function jitterFor(seed: string): number[] {
  const rng = mulberry32(hashSeed(seed));
  const ctrl = Array.from({ length: JITTER_CONTROLS }, () => rng() * 2 - 1);

  return Array.from({ length: MORPH_POINTS }, (_, i) => {
    const t = (i / MORPH_POINTS) * JITTER_CONTROLS;
    const i0 = Math.floor(t) % JITTER_CONTROLS;
    const i1 = (i0 + 1) % JITTER_CONTROLS;
    const f = t - Math.floor(t);
    const s = (1 - Math.cos(f * Math.PI)) / 2;
    return (ctrl[i0] * (1 - s) + ctrl[i1] * s) * JITTER_AMOUNT;
  });
}

/**
 * Una silueta lista para morphear, como dos arrays paralelos de 64 valores:
 * el radio "ideal" en cada ángulo y el offset irregular de esa Season. Se
 * mantienen separados a propósito — así el jitter se suma DESPUÉS de
 * interpolar los radios y el morph en sí queda limpio.
 */
export interface ShapeSample {
  radii: number[];
  jitter: number[];
}

export function sampleShape(forma: Forma, seed: string): ShapeSample {
  const verts = VERTICES[forma];
  const radii = Array.from({ length: MORPH_POINTS }, (_, i) => {
    const angle = -90 + (360 / MORPH_POINTS) * i;
    return verts ? radiusAtAngle(verts, angle) : R;
  });

  // Normalización sobre los radios ya muestreados, no sobre los vértices: en
  // la X las puntas caen ENTRE dos ángulos de muestreo (-28.3° contra los
  // -28.125° de la grilla), así que escalar los vértices la dejaba ~1% más
  // chica que las otras cuatro. Escalando acá, las 5 siluetas comparten radio
  // circunscripto exacto tal como se dibujan.
  const max = Math.max(...radii);
  const k = max > 0 ? R / max : 1;

  return {
    radii: radii.map((r) => r * k),
    jitter: jitterFor(`${forma}:${seed}`),
  };
}

/**
 * Path del morph entre dos siluetas en el progreso `p` (0 = `a`, 1 = `b`).
 * Radios y jitter se interpolan por separado y se suman al final; el path
 * sale siempre con la misma estructura (`M` + 63 `L` + `Z`), que es lo que
 * permite que Motion lo interpole si hiciera falta.
 */
export function morphPath(a: ShapeSample, b: ShapeSample, p: number): string {
  let d = "";

  for (let i = 0; i < MORPH_POINTS; i++) {
    const base = a.radii[i] + (b.radii[i] - a.radii[i]) * p;
    const wobble = a.jitter[i] + (b.jitter[i] - a.jitter[i]) * p;
    const r = base + wobble;
    const dir = DIRS[i];
    const x = CX + dir.x * r;
    const y = CY + dir.y * r;
    d += `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)} `;
  }

  return `${d}Z`;
}
