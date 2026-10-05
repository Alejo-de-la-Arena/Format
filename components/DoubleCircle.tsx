import type { CSSProperties } from "react";

/** PULSE: dos anillos concéntricos. Mismas props visuales que Glyph. */
export default function DoubleCircle({ className, style, strokeWidth = 3 }: {
  className?: string;
  style?: CSSProperties;
  strokeWidth?: number;
}) {
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor"
      className={className} style={style} aria-hidden>
      <circle cx="50" cy="50" r="46" strokeWidth={strokeWidth} />
      <circle cx="50" cy="50" r="42" strokeWidth={strokeWidth} />
    </svg>
  );
}
