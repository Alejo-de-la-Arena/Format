import type { CSSProperties } from "react";
import { DOUBLE_DIAMOND_INNER, roundedDiamondPath } from "@/components/shapePaths";

const OUTER = 46;
const INNER = OUTER * DOUBLE_DIAMOND_INNER;
const PATHS = [OUTER, INNER].map((h) => roundedDiamondPath(50, 50, h, h * 0.12));

/** JUNGLE: rombo con doble línea y esquinas redondeadas. Mismas props visuales que DoubleCircle. */
export default function DoubleDiamond({ className, style, strokeWidth = 3 }: {
  className?: string;
  style?: CSSProperties;
  strokeWidth?: number;
}) {
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeLinejoin="round"
      className={className} style={style} aria-hidden>
      {PATHS.map((d) => <path key={d} d={d} strokeWidth={strokeWidth} />)}
    </svg>
  );
}
