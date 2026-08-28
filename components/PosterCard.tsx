import type { Fecha, Season } from "@/lib/types";
import { fechaCorta } from "@/lib/dates";
import { getSeasonColors } from "@/lib/season-colors";
import FlyerImage, { FLYER_CARD_WIDTH } from "@/components/FlyerImage";

const VENUE = "Av. Costanera Rafael Obligado 4801";

/**
 * Card tipo poster del slider de próximos viernes. La imagen (flyer) es el
 * contenido; debajo sólo fecha, nombre de la Season y venue. No linkea: el
 * flyer ya trae todo lo que hay que saber de una noche que todavía no pasó,
 * así que no hay detalle al que ir (a diferencia de ArchiveCard).
 */
export default function PosterCard({
  fecha,
  season,
  dark = false,
}: {
  fecha: Fecha;
  season: Season;
  dark?: boolean;
}) {
  const colors = getSeasonColors(season);

  return (
    <div className={`${FLYER_CARD_WIDTH} shrink-0 overflow-hidden`}>
      <FlyerImage
        src={fecha.flyer}
        alt={`Flyer de ${season.nombre}`}
        colors={colors}
        forma={season.forma}
        label="Flyer — próximamente"
      />
      <div className="flex flex-col gap-1 pt-3">
        <span className="label-mono" style={{ color: dark ? "#FFFFFF" : colors[0] }}>
          {fechaCorta(fecha.fecha)}
        </span>
        <span className="text-lg font-bold tracking-tight">{season.nombre}</span>
        <span className={`text-[13px] ${dark ? "text-white/70" : "text-muted"}`}>{VENUE}</span>
      </div>
    </div>
  );
}
