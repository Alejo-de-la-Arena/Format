import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import EventImage from "@/components/EventImage";
import ShapeSticker from "@/components/ShapeSticker";
import ExternalArrow from "@/components/ExternalArrow";
import HoverArrow from "@/components/HoverArrow";
import HoverAnchor from "@/components/HoverAnchor";
import HoverLink from "@/components/HoverLink";
import ExperienceBadge from "@/components/ExperienceBadge";
import { EXTERNAL_LINK, SOCIAL } from "@/lib/social";
import { getFechasOrdenadas, getProximaFecha } from "@/lib/data/fechas";
import { getSeasons } from "@/lib/data/seasons";
import { getSeasonColors } from "@/lib/season-colors";
import { fechaCorta, fechaLarga, rangoHorario } from "@/lib/dates";

const wrap = "mx-auto max-w-[1400px] px-[clamp(18px,4vw,48px)]";

export const metadata: Metadata = {
  title: "Fechas — FORMAT",
  description:
    "Calendario de FORMAT Residence en Av. Costanera Rafael Obligado 4801, todos los viernes.",
};

export const revalidate = 300;

export default async function FechasPage() {
  const [todas, seasons] = await Promise.all([getFechasOrdenadas(), getSeasons()]);
  const seasonBySlug = new Map(seasons.map((s) => [s.slug, s]));

  if (todas.length === 0) {
    return (
      <>
        <Nav />
        <main className={`${wrap} py-[clamp(60px,10vw,120px)] text-center`}>
          <p className="label-mono text-muted">Fechas</p>
          <p className="mt-4 text-lg text-muted">
            Todavía no hay próximas fechas confirmadas.
          </p>
          <HoverAnchor
            href={SOCIAL.instagram}
            {...EXTERNAL_LINK}
            className="label-mono mt-6 inline-flex items-center gap-1.5 border border-line px-5 py-3 transition-colors hover:border-accent-1"
          >
            Seguí las novedades en Instagram
            <ExternalArrow />
          </HoverAnchor>
        </main>
        <Footer />
      </>
    );
  }

  const destacado = (await getProximaFecha()) ?? todas[todas.length - 1];
  const resto = todas.filter((f) => f !== destacado);
  // FK garantiza que la Season de una Fecha siempre existe.
  const destacadoSeason = seasonBySlug.get(destacado.seasonSlug)!;
  const destacadoColors = getSeasonColors(destacadoSeason);
  const destacadoHorario = rangoHorario(destacado.horaInicio, destacado.horaFin);

  return (
    <>
      <Nav />
      <main className="py-[clamp(28px,4vw,52px)]">
        <div className={`${wrap} max-lg:flex max-lg:min-h-[70vh] max-lg:flex-col max-lg:justify-center`}>
          <p className="label-mono text-center text-accent-1 lg:text-left">Próximo viernes</p>

          <Link
            href={`/eventos/${destacadoSeason.slug}?fecha=${destacado.fecha}`}
            className="group mt-4 flex flex-col items-center gap-5 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14"
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden border border-line bg-paper-2">
              <EventImage
                src={destacado.flyer}
                alt={`Flyer de ${destacadoSeason.nombre}`}
                colors={destacadoColors}
                forma={destacadoSeason.forma}
                label="Flyer — próximamente"
                fit="contain"
                sizes="(max-width: 1024px) 100vw, 45vw"
              />
              {destacado.especial && (
                <ExperienceBadge className="absolute left-3 top-3" />
              )}
            </div>

            <div className="text-center lg:text-left">
              <h1 className="text-[clamp(40px,7vw,84px)] font-extrabold leading-[0.95] tracking-[-0.03em]">
                {destacadoSeason.nombre}
              </h1>
              <p className="mt-4 text-[clamp(15px,1.6vw,18px)] text-muted">
                {fechaLarga(destacado.fecha)}
                {destacadoHorario ? ` · ${destacadoHorario}` : ""}
              </p>
              <p className="mt-1.5 text-sm text-muted">
                Av. Costanera Rafael Obligado 4801
              </p>
            </div>
          </Link>
        </div>

        {resto.length > 0 && (
          <div className={`${wrap} mt-12`}>
            <p className="label-mono mb-3 text-muted">Próximas fechas</p>
            <ul className="flex flex-col divide-y divide-line border-t border-line">
              {resto.map((f) => {
                const season = seasonBySlug.get(f.seasonSlug);
                if (!season) return null;
                const colors = getSeasonColors(season);
                const isEspecial = f.especial;
                return (
                  <li key={`${f.seasonSlug}-${f.fecha}`}>
                    <HoverLink
                      href={`/eventos/${season.slug}?fecha=${f.fecha}`}
                      className={`group flex items-center gap-4 transition-colors hover:bg-ink/[0.04] ${
                        isEspecial ? "py-5" : "py-3.5"
                      }`}
                    >
                      <div
                        className={`relative shrink-0 overflow-hidden border border-line bg-paper-2 ${
                          isEspecial ? "aspect-[3/4] w-16 sm:w-20" : "aspect-[3/4] w-11 sm:w-14"
                        }`}
                      >
                        {f.flyer ? (
                          <Image
                            src={f.flyer}
                            alt={`Flyer de ${season.nombre}`}
                            fill
                            sizes="96px"
                            className="object-contain transition-transform duration-500 group-hover:scale-[1.05]"
                          />
                        ) : (
                          <div
                            className="flex h-full w-full items-center justify-center"
                            style={{
                              background: `radial-gradient(80% 80% at 50% 20%, color-mix(in srgb, ${colors[2]} 55%, var(--color-paper-2)), var(--color-paper-2) 75%)`,
                            }}
                          >
                            <ShapeSticker
                              forma={season.forma}
                              color={colors[0]}
                              size={isEspecial ? 28 : 18}
                              rotate={-3}
                              seed={`${f.seasonSlug}-${f.fecha}`}
                            />
                          </div>
                        )}
                      </div>

                      <span className="label-mono shrink-0 whitespace-nowrap text-muted">
                        {fechaCorta(f.fecha)}
                      </span>

                      <span className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                        <span
                          className={`truncate font-bold tracking-tight ${
                            isEspecial ? "text-xl sm:text-2xl" : "text-base text-ink sm:text-lg"
                          }`}
                        >
                          {season.nombre}
                        </span>
                        {isEspecial && <ExperienceBadge className="w-fit" />}
                      </span>

                      <HoverArrow className="label-mono shrink-0 text-muted transition-colors group-hover:text-accent-1" />
                    </HoverLink>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
