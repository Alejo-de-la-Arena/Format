import type { CSSProperties } from "react";
import type { Forma } from "@/lib/types";
import { SHAPE_PATHS } from "@/components/shapePaths";
import DoubleCircle from "@/components/DoubleCircle";
import { normalizeForma } from "@/lib/season-shape";

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
  forma = normalizeForma(forma);
  if (forma === "double-circle") {
    return <DoubleCircle className={className} style={style} strokeWidth={strokeWidth * 1.5} />;
  }
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
