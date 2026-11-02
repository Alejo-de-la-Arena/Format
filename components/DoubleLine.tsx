import type { CSSProperties } from "react";
import DoubleCircle from "@/components/DoubleCircle";
import DoubleDiamond from "@/components/DoubleDiamond";
import type { Forma } from "@/lib/types";

/** Contorno de las formas de doble línea (ver isDoubleLine). */
export default function DoubleLine({ forma, ...props }: {
  forma: Forma;
  className?: string;
  style?: CSSProperties;
  strokeWidth?: number;
}) {
  return forma === "double-diamond" ? <DoubleDiamond {...props} /> : <DoubleCircle {...props} />;
}
