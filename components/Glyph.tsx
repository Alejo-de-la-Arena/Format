import type { CSSProperties } from "react";
import type { Forma } from "@/lib/types";
import { SHAPE_PATHS } from "@/components/shapePaths";

/** Glifo geométrico de la Season, sólo línea. Hereda el color via currentColor. */
export default function Glyph({
  forma,
  className,
  style,
  strokeWidth = 2,
}: {
  forma: Forma;
  className?: string;
  style?: CSSProperties;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 72 72"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden
    >
      <path d={SHAPE_PATHS[forma]} />
    </svg>
  );
}
