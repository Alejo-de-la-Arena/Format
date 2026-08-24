import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import EventImage from "@/components/EventImage";
import EventGallery from "@/components/EventGallery";
import ShareButtons from "@/components/ShareButtons";
import ExperienceBadge from "@/components/ExperienceBadge";
import RotatingAccent from "@/components/RotatingAccent";
import ExternalArrow from "@/components/ExternalArrow";
import HoverAnchor from "@/components/HoverAnchor";
import SectionTitle from "@/components/SectionTitle";
import TapeBlock from "@/components/TapeBlock";
import { getSeasons, getSeason, getAccentsExcept } from "@/lib/data/seasons";
import { getSeasonColors } from "@/lib/season-colors";
import { seasonAccentVars } from "@/lib/theme";
import { getFechasBySeason } from "@/lib/data/fechas";
import { fechaCorta, esPasado, rangoHorario } from "@/lib/dates";
import { getSoundcloudEmbedUrl, getYoutubeEmbedUrl } from "@/lib/embed";
import type { Fecha, Season } from "@/lib/types";

const wrap = "mx-auto max-w-[1400px] px-[clamp(18px,4vw,48px)]";
const VENUE = "Av. Costanera Rafael Obligado 4801";

export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const seasons = await getSeasons();
    return seasons.map((s) => ({ slug: s.slug }));
  } catch {
    // Supabase no disponible en build time (ej. .env sin configurar aún):
    // no bloquea el build, todas las Seasons se sirven on-demand
    // (dynamicParams=true, default).
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const season = await getSeason(slug);
  if (!season) return {};
  return {
    title: `${season.nombre} — FORMAT ${season.numero}`,
    description: season.concepto,
  };
}

/** Flyer + glow (rol 3: gradientes/glow) detrás. Cada variante ya trae sus
 * propios colores resueltos (fijos, o una rotación de Infinity) — mismo
 * prop `colors` que consume EventImage en el resto del sitio, con un glow
 * sumado usando el rol de gradiente. */
function FlyerVisual({
  colors,
  heroFlyer,
  season,
  fullBleed,
}: {
  colors: [string, string, string, string, string];
  heroFlyer?: Fecha["flyer"];
  season: Season;
  fullBleed: boolean;
}) {
  const glow = colors[2];

  if (fullBleed) {
    return (
      <div className="relative h-[68vh] max-h-[620px] w-full overflow-hidden">
        <EventImage
          src={heroFlyer}
          alt={`Flyer de ${season.nombre}`}
          colors={colors}
          forma={season.forma}
          label="Flyer — próximamente"
          sizes="100vw"
          fit="contain"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
          style={{
            background: `linear-gradient(to top, color-mix(in srgb, ${glow} 45%, var(--color-paper-2)) 0%, transparent 100%)`,
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-10 -z-10 rounded-full opacity-70 blur-[90px]"
        style={{
          background: `radial-gradient(circle, color-mix(in srgb, ${glow} 55%, transparent) 0%, transparent 70%)`,
        }}
      />
      <div className="relative aspect-[3/4] w-full overflow-hidden border border-line bg-paper-2">
        <EventImage
          src={heroFlyer}
          alt={`Flyer de ${season.nombre}`}
          colors={colors}
          forma={season.forma}
          label="Flyer — próximamente"
          sizes="(max-width: 1024px) 100vw, 46vw"
          fit="contain"
        />
      </div>
    </div>
  );
}

/** Card de metadata (lugar, cocktail…): tag de cinta superpuesto arriba a
 * la izquierda + valor grande abajo, en vez de una fila dt/dd plana. Mismo
 * mecanismo de TapeBlock que los títulos de sección, a menor escala. */
function MetaCard({
  label,
  value,
  detail,
  rotate,
}: {
  label: string;
  value: string;
  detail?: string;
  rotate: number;
}) {
  return (
    <div
      className="relative flex-1 border border-line bg-paper-2 px-5 pb-5 pt-7"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <TapeBlock
        as="span"
        edge={2}
        rotate={rotate * -1.4}
        className="absolute -top-3 left-4 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.1em]"
      >
        {label}
      </TapeBlock>
      <p className="text-[17px] font-bold leading-snug">{value}</p>
      {detail && <p className="mt-1.5 text-[13px] leading-snug text-muted">{detail}</p>}
    </div>
  );
}

/** "Tomás b2b Malva": el "b2b" en el acento de la Season, el resto en
 * color normal — separa visualmente el back-to-back del nombre. */
function ArtistaNames({ artistas }: { artistas: string[] }) {
  return (
    <>
      {artistas.map((nombre, i) => (
        <span key={i}>
          {i > 0 && <span className="text-accent-1"> b2b </span>}
          {nombre}
        </span>
      ))}
    </>
  );
}

function FechaRow({
  fecha,
  season,
}: {
  fecha: Fecha;
  season: Season;
}) {
  const pasado = esPasado(fecha.fecha);
  const colors = getSeasonColors(season);
  const youtubeEmbed = fecha.youtube ? getYoutubeEmbedUrl(fecha.youtube) : null;

  // La página muestra un solo viernes: abierto de entrada, sin pedir un click.
  return (
    <details
      id={`viernes-${fecha.fecha}`}
      className="group scroll-mt-24 border-b border-line first:pt-0"
      open
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-4 transition-colors hover:bg-ink/[0.04] [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 flex-1 items-center gap-3">
          <span className="label-mono shrink-0 text-muted">
            {fechaCorta(fecha.fecha)}
          </span>
          {fecha.especial && <ExperienceBadge className="shrink-0" />}
        </span>
        <span className="label-mono shrink-0 text-muted">
          {pasado ? "Pasado" : "Próximo"}
        </span>
        <span
          aria-hidden
          className="shrink-0 text-muted transition-all duration-200 group-open:rotate-45 group-open:text-accent-1"
        >
          +
        </span>
      </summary>

      <div className="px-3 pb-6 pt-1">
        {/* El trago es de toda la Season: va una sola vez, en la MetaCard
            "Cocktail" de arriba. Acá no se repite. */}
        {fecha.lineup && fecha.lineup.length > 0 ? (
          <div className="mt-6">
            <SectionTitle title="Line-up" />
            <ul className="flex flex-col">
              {fecha.lineup.map((slot) => {
                const slotHorario = rangoHorario(slot.horaInicio, slot.horaFin);
                return (
                  <li
                    key={slot.orden}
                    className="flex items-baseline justify-between gap-4 border-b border-line py-3 first:pt-0"
                  >
                    <span className="text-base font-bold tracking-tight">
                      <ArtistaNames artistas={slot.artistas} />
                    </span>
                    {slotHorario && (
                      <span className="label-mono shrink-0 text-muted">
                        {slotHorario}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">Line-up, pronto.</p>
        )}

        {pasado && (
          <>
            <div className="mt-8">
              <h3 className="label-mono mb-4 text-muted">Fotos de la noche</h3>
              <EventGallery
                fotos={(fecha.galeria ?? []).map((id) => ({
                  src: id,
                  alt: `Foto de ${season.nombre} — ${fechaCorta(fecha.fecha)}`,
                }))}
                colors={colors}
                forma={season.forma}
              />
            </div>

            {(youtubeEmbed || fecha.soundcloud) && (
              <div className="mt-8">
                <h3 className="label-mono mb-4 text-muted">Set completo</h3>
                {youtubeEmbed ? (
                  <div className="relative aspect-video w-full overflow-hidden border border-line bg-ink">
                    <iframe
                      src={youtubeEmbed}
                      title={`Set de ${season.nombre} — ${fechaCorta(fecha.fecha)}`}
                      className="absolute inset-0 h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  fecha.soundcloud && (
                    <iframe
                      src={getSoundcloudEmbedUrl(fecha.soundcloud)}
                      title={`Set de ${season.nombre} — ${fechaCorta(fecha.fecha)}`}
                      className="w-full"
                      height={166}
                      allow="autoplay"
                    />
                  )
                )}
              </div>
            )}
          </>
        )}
      </div>
    </details>
  );
}

export default async function SeasonPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ fecha?: string | string[] }>;
}) {
  const { slug } = await params;
  const season = await getSeason(slug);
  if (!season) notFound();

  const fechasSeason = await getFechasBySeason(season.slug);

  // La página muestra UN viernes: el que se clickeó, que llega en `?fecha=`.
  // Sin ese parámetro (o con uno que no es de esta Season) cae al próximo
  // viernes de la Season, y si ya pasaron todos, al último.
  const { fecha: fechaParam } = await searchParams;
  const pedida = Array.isArray(fechaParam) ? fechaParam[0] : fechaParam;
  const fechaActiva =
    fechasSeason.find((f) => f.fecha === pedida) ??
    fechasSeason.find((f) => !esPasado(f.fecha)) ??
    fechasSeason[fechasSeason.length - 1];

  // El flyer del viernes que se está mirando; si esa fecha todavía no tiene
  // uno cargado, el primero de la Season.
  const heroFlyer = fechaActiva?.flyer ?? fechasSeason.find((f) => f.flyer)?.flyer;
  const hayProximos = fechasSeason.some((f) => !esPasado(f.fecha));

  // La MetaCard "Cocktail" se arma con la fecha de apertura (especial=true,
  // la primera cronológicamente) que ya tenga trago cargado.
  const fechaApertura = fechasSeason.find((f) => f.especial && f.tragoAutor);

  const isInfinity = season.slug === "infinity";
  // Cada variante trae su propio set de 5 colores ya resuelto: la Season
  // fija usa su paleta completa; Infinity rota el principal de las 5
  // anteriores, reutilizado en los 5 roles (misma regla de fallback).
  const flyerColorSets: [string, string, string, string, string][] = isInfinity
    ? (await getAccentsExcept("infinity")).map((c) => [c, c, c, c, c])
    : [getSeasonColors(season)];

  return (
    <div style={seasonAccentVars(season)}>
      <Nav />
      <main>
        <div className={`${wrap} py-[clamp(28px,4vw,52px)]`}>
          <div className="grid gap-x-[clamp(32px,5vw,72px)] gap-y-10 lg:grid-cols-[1fr_1.15fr]">
            {/* CONTENIDO */}
            <div className="min-w-0">
              <div className="text-center lg:text-left">
                <p className="label-mono text-accent-1">FORMAT {season.numero}</p>
                <h1 className="mt-3 font-body text-[clamp(46px,8.5vw,108px)] font-extrabold leading-[0.9] tracking-[-0.035em]">
                  {season.nombre}
                </h1>
                {season.concepto && (
                  <p className="mx-auto mt-4 max-w-[52ch] text-[15px] text-muted lg:mx-0">
                    {season.concepto}
                  </p>
                )}
              </div>

              {/* FLYER — en mobile va debajo del título, full-bleed (rompe el
                  padding del wrap con el margen negativo). La imagen se
                  muestra entera: `contain`, nunca recortada ni estirada. */}
              <div className="lg:hidden">
                <div className="-mx-[clamp(18px,4vw,48px)] mt-8">
                  <RotatingAccent
                    variants={flyerColorSets.map((colors) => (
                      <FlyerVisual
                        key={colors[0]}
                        colors={colors}
                        heroFlyer={heroFlyer}
                        season={season}
                        fullBleed
                      />
                    ))}
                  />
                </div>
                <div className="mt-4">
                  <ShareButtons
                    title={`${season.nombre} — FORMAT`}
                    url={`https://format-jet.com/eventos/${season.slug}`}
                  />
                </div>
              </div>

              <div className="mt-10 flex flex-col gap-5 sm:flex-row">
                <MetaCard label="Lugar" value={VENUE} rotate={-1} />
                {fechaApertura?.tragoAutor && (
                  <MetaCard
                    label="Cocktail"
                    value={fechaApertura.tragoAutor.nombre}
                    detail={fechaApertura.tragoAutor.descripcion}
                    rotate={1}
                  />
                )}
              </div>

              {fechaActiva && (
                <>
                  {/* La fecha de este evento, sin navegación a las otras
                      fechas de la Season. */}

                  <section className="mt-10">
                    <FechaRow fecha={fechaActiva} season={season} />
                  </section>
                </>
              )}

              {hayProximos && (
                <section className="mt-10">
                  <HoverAnchor
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="label-mono flex items-center justify-center gap-1.5 border border-line px-5 py-4 text-center transition-colors hover:border-accent-1"
                  >
                    Seguí las novedades en Instagram
                    <ExternalArrow />
                  </HoverAnchor>
                </section>
              )}
            </div>

            {/* FLYER — sticky a la derecha en desktop */}
            <aside className="hidden lg:block lg:sticky lg:top-[84px] lg:h-fit">
              <RotatingAccent
                variants={flyerColorSets.map((colors) => (
                  <FlyerVisual
                    key={colors[0]}
                    colors={colors}
                    heroFlyer={heroFlyer}
                    season={season}
                    fullBleed={false}
                  />
                ))}
              />
              <div className="mt-4">
                <ShareButtons
                  title={`${season.nombre} — FORMAT`}
                  url={`https://format-jet.com/eventos/${season.slug}`}
                />
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
