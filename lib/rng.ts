/**
 * PRNG determinístico compartido por la geometría "a mano" del sitio
 * (components/shapePaths.ts, lib/shape-morph.ts): misma seed → misma
 * secuencia siempre. Es lo que permite jitterear vértices sin generar
 * mismatches de hidratación entre server y client (nada de Math.random).
 */

/** FNV-1a: string/number → uint32 estable. */
export function hashSeed(seed: string | number): number {
  const str = String(seed);
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32: generador chico y rápido, suficiente para jitter visual. */
export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
