/** Botanical cutouts drawn in the same ink as the Season's outlines.
 * Root at (0, 0); growth points upward. No animation or layout of their own. */
export function PlantSprig({ variant = 0 }: { variant?: number }) {
  const fern = variant % 3 === 1;
  const tropical = variant % 3 === 2;
  return <g fill="currentColor" stroke="none">
    <path d="M-.7 1 C-3-14 5-29 1-43 L2-43 C7-28-1-13 .7 1Z" />
    {(fern ? [0, 1, 2, 3, 4, 5] : [0, 1, 2, 3]).map((i) => {
      const y = -8 - i * (fern ? 5 : 8);
      const x = i < 2 ? 0 : 2;
      const length = fern ? 13 - i : tropical ? 18 - i * 2 : 13 - i;
      return <g key={i} transform={`translate(${x} ${y})`}>
        <path d={`M0 0 Q${-length} 0 ${-length} -9 Q-3 -12 0 0Z`} />
        <path d={`M0 -2 Q${length + 2} -3 ${length} -13 Q2 -12 0 -2Z`} />
        {tropical && <path d={`M-3 -3 L${-length + 2} -7 M3 -5 L${length - 2} -10`} stroke="var(--color-paper)" strokeWidth=".8" />}
      </g>;
    })}
    <path d="M2-36 Q-5-44 1-51 Q9-44 2-36Z" />
  </g>;
}

export default function JunglePlants({ className, style, variant = 0 }: {
  className?: string;
  style?: import("react").CSSProperties;
  variant?: number;
}) {
  return <svg viewBox="-24 -58 48 62" fill="none" aria-hidden="true" focusable="false"
    className={className} style={{ pointerEvents: "none", ...style }}>
    <PlantSprig variant={variant} />
  </svg>;
}
