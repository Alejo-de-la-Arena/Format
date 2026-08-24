import type { Fecha, Season } from "@/lib/types";
import { getSeasonColors } from "@/lib/season-colors";
import FlyerImage, { FLYER_CARD_WIDTH } from "@/components/FlyerImage";
import HoverLink from "@/components/HoverLink";
import HoverArrow from "@/components/HoverArrow";

/**
 * Card del slider de ediciones anteriores: el flyer, nada más — mismo
 * tratamiento de imagen que PosterCard (FlyerImage, sin recorte).
 * Debajo, un único link discreto al detalle. El `?fecha=` le dice a la página
 * de Season cuál de sus viernes mostrar (el que se clickeó, no el de apertura).
 */
export default function ArchiveCard({
  fecha,
  season,
}: {
  fecha: Fecha;
  season: Season;
}) {
  const colors = getSeasonColors(season);

  return (
    <HoverLink
      href={`/eventos/${season.slug}?fecha=${fecha.fecha}`}
      className={`group block ${FLYER_CARD_WIDTH} shrink-0 overflow-hidden`}
    >
      <FlyerImage
        src={fecha.flyer}
        alt={`Flyer de ${season.nombre}`}
        colors={colors}
        forma={season.forma}
        label="Flyer"
      />
      <span className="label-mono mt-3 inline-flex items-center gap-1.5 text-muted transition-colors group-hover:text-accent-1">
        Ver detalles del evento
        <HoverArrow />
      </span>
    </HoverLink>
  );
}
