import type { CSSProperties } from "react";
import type { Forma } from "@/lib/types";
import { getShapePath } from "@/components/shapePaths";

/**
 * La forma de la Season como sticker sólido (relleno, no sólo línea) en el
 * color de acento. Rotable, con logo opcional adentro. Usado en placeholders
 * de flyer/galería, la banda Experience y ExperienceBadge.
 */
export default function ShapeSticker({
  forma,
  color,
  rotate = 0,
  size = 96,
  withLogo = false,
  opacity = 1,
  seed,
  className,
  style,
}: {
  forma: Forma;
  color: string;
  rotate?: number;
  size?: number;
  withLogo?: boolean;
  opacity?: number;
  /** Varía el jitter de vértices entre instancias de la misma forma — misma
   * seed siempre da el mismo resultado. Sin seed, jitter fijo por forma. */
  seed?: string | number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden
      className={`relative shrink-0 ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        opacity,
        transform: `rotate(${rotate}deg)`,
        ...style,
      }}
    >
      <svg viewBox="0 0 72 72" className="h-full w-full">
        <path d={getShapePath(forma, seed)} fill={color} />
      </svg>
      {withLogo && (
        <span
          className="absolute inset-0 flex items-center justify-center text-center font-body text-[9px] font-extrabold uppercase leading-none tracking-[0.08em] text-paper"
          style={{ transform: `rotate(${-rotate}deg)` }}
        >
          Format
        </span>
      )}
    </div>
  );
}
