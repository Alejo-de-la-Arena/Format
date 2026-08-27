import type { CSSProperties, ElementType, ReactNode } from "react";

/**
 * Bloques de cinta: rectángulos negros sólidos con el texto calado en gris
 * papel, bordes irregulares como recortados. Tratamiento tipográfico
 * principal para títulos y datos — ver CLAUDE.md § Mecanismos visuales.
 */

/** Bordes recortados, exportados para los casos que necesitan el mismo
 *  tratamiento sobre un elemento propio (ej. el poster de VideoPlayer o las
 *  cintas de WhatIsFormat, que no pueden envolverse en un TapeBlock). */
export const EDGES: Record<1 | 2 | 3, string> = {
  1: "polygon(0% 6%, 2% 0%, 25% 2%, 50% 0%, 75% 3%, 98% 0%, 100% 5%, 99% 30%, 100% 55%, 98% 80%, 100% 94%, 97% 100%, 72% 98%, 48% 100%, 22% 97%, 3% 100%, 0% 92%, 2% 65%, 0% 40%, 1% 20%)",
  2: "polygon(1% 0%, 30% 3%, 60% 0%, 100% 4%, 98% 22%, 100% 45%, 97% 68%, 100% 90%, 96% 100%, 65% 97%, 35% 100%, 4% 96%, 0% 78%, 2% 52%, 0% 28%, 3% 8%)",
  3: "polygon(3% 2%, 40% 0%, 80% 3%, 100% 0%, 100% 20%, 98% 50%, 100% 78%, 100% 100%, 60% 98%, 20% 100%, 0% 96%, 2% 60%, 0% 30%, 1% 10%)",
};

export default function TapeBlock({
  children,
  rotate = -1.5,
  edge = 1,
  /** true en fondos ya oscuros (bandas ink): invierte a bloque papel/texto ink. */
  invert = false,
  as: Component = "span",
  className,
  style,
}: {
  children: ReactNode;
  /** Grados de rotación, -3 a 3 sugerido. */
  rotate?: number;
  edge?: 1 | 2 | 3;
  invert?: boolean;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <Component
      className={`inline-block px-[0.6em] py-[0.3em] ${invert ? "bg-paper text-ink" : "bg-ink text-paper"} ${className ?? ""}`}
      style={{
        transform: `rotate(${rotate}deg)`,
        clipPath: EDGES[edge],
        ...style,
      }}
    >
      {children}
    </Component>
  );
}
