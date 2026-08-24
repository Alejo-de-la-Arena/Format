import type { Forma, ImageSrc } from "@/lib/types";
import EventImage from "@/components/EventImage";

/**
 * Ancho del card que envuelve el flyer — compartido por PosterCard
 * (Próximos eventos) y ArchiveCard (Ediciones anteriores) para que ambos
 * sliders queden con el mismo tamaño de flyer y no se desincronicen.
 */
export const FLYER_CARD_WIDTH = "w-[clamp(240px,26vw,320px)]";

/**
 * Flyer a ancho completo con el alto que resulte de su proporción real —
 * nunca recorta ni deforma (no usa `next/image fill`, que exige un
 * contenedor de aspect-ratio fijo y termina generando letterbox). Usado
 * por PosterCard y ArchiveCard, mismo criterio en los dos.
 */
export default function FlyerImage({
  src,
  alt,
  colors,
  forma,
  label,
}: {
  src?: ImageSrc;
  alt: string;
  colors: [string, string, string, string, string];
  forma: Forma;
  label: string;
}) {
  const url = typeof src === "string" ? src : src?.src;

  if (url) {
    return (
      <img
        src={url}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="block h-auto w-full border border-line transition-transform duration-500 group-hover:scale-[1.02]"
      />
    );
  }

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden border border-line bg-paper-2">
      <EventImage alt={alt} colors={colors} forma={forma} label={label} />
    </div>
  );
}
