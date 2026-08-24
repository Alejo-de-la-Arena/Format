import Image from "next/image";
import type { Forma, ImageSrc } from "@/lib/types";
import ShapeSticker from "@/components/ShapeSticker";

/**
 * Imagen de un evento (flyer o foto de la puesta). Cuando existe la URL,
 * renderiza <Image> de next; mientras no exista, muestra un ShapeSticker de
 * la Season sobre papel. El <Image> queda listo para el día que las
 * imágenes vivan en Supabase Storage.
 *
 * El contenedor padre debe ser `relative` con un aspect-ratio definido.
 */
export default function EventImage({
  src,
  alt,
  colors,
  forma,
  label,
  sizes,
  variant = "poster",
  fit = "cover",
}: {
  src?: ImageSrc;
  alt: string;
  colors: [string, string, string, string, string];
  forma: Forma;
  label: string;
  sizes?: string;
  variant?: "poster" | "shot";
  /** "contain" para piezas que no se pueden recortar (ej. el flyer del
   * detalle de evento) — se ve completa, con el fondo del contenedor
   * asomando en los bordes si la proporción no calza exacto. */
  fit?: "cover" | "contain";
}) {
  const motionCls =
    "h-full w-full transition-transform duration-500 group-hover:scale-[1.03]";

  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes ?? "(max-width: 768px) 90vw, 33vw"}
        className={`${fit === "contain" ? "object-contain" : "object-cover"} ${motionCls}`}
      />
    );
  }

  const [c1, , c3] = colors;
  const bg =
    variant === "shot"
      ? `radial-gradient(80% 120% at 50% 0%, color-mix(in srgb, ${c3} 55%, var(--color-paper-2)), var(--color-paper-2) 72%)`
      : `linear-gradient(160deg, color-mix(in srgb, ${c3} 55%, var(--color-paper-2)), var(--color-paper-2) 68%)`;

  return (
    <div
      className={`relative flex items-center justify-center ${motionCls}`}
      style={{ background: bg }}
      role="img"
      aria-label={alt}
    >
      <ShapeSticker forma={forma} color={c1} size={88} rotate={-4} seed={alt} />
      <span className="absolute bottom-3.5 left-3.5 right-3.5 text-center text-[9px] font-semibold uppercase tracking-[0.14em] text-ink/50">
        {label}
      </span>
    </div>
  );
}
