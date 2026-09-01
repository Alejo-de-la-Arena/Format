import Link from "next/link";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import SectionTitle from "@/components/SectionTitle";
import PosterCard from "@/components/PosterCard";
import ArchiveCard from "@/components/ArchiveCard";
import ShapeSticker from "@/components/ShapeSticker";
import WhatIsFormat from "@/components/WhatIsFormat";
import VideoPlayer from "@/components/VideoPlayer";
import HomeReveal from "@/components/home/HomeReveal";
import { getIntroSeasons } from "@/lib/season-intro";
import {
  getFechasProximasConFlyer,
  getFechasPasadas,
  getProximaFechaEspecial,
} from "@/lib/data/fechas";
import { getSeasons, getActiveSeason } from "@/lib/data/seasons";
import { getSeasonColors } from "@/lib/season-colors";
import { isVideoUrl } from "@/lib/embed";

const wrap = "mx-auto max-w-[1400px] px-[clamp(18px,4vw,48px)]";
const sectionPad = "py-[clamp(44px,5vw,72px)]";

/** Red de seguridad: revalida aunque una mutación desde /admin no dispare revalidatePath. */
export const revalidate = 300;

const EXPERIENCE_FALLBACK =
  "Una noche distinta: escenografía completa, cocktail propio y el mejor lineup. Una vez por mes en la terraza.";

/**
 * Copy de la sección Experience de la home, armado con los datos reales de
 * la próxima fecha especial=true (Season, headliner, trago) en vez de texto
 * fijo — así se actualiza solo cuando cambia la Season/fecha. Si falta algún
 * dato se arma con lo que hay; sin ninguna fecha Experience próxima, cae al
 * texto genérico.
 */
function experienceCopy(seasonNombre?: string, headliner?: string, cocktail?: string): string {
  if (!seasonNombre) return EXPERIENCE_FALLBACK;

  const clausulas: string[] = [];
  if (cocktail) clausulas.push("cocktail de autor");
  if (headliner) clausulas.push(`nuestro invitado ${headliner}`);
  clausulas.push("una puesta en escena completa en la terraza");

  const cuerpo =
    clausulas.length > 1
      ? `${clausulas.slice(0, -1).join(", ")} y ${clausulas[clausulas.length - 1]}`
      : clausulas[0];

  return `Format Experience presenta ${seasonNombre}: una noche de ${cuerpo}.`;
}

export default async function Home() {
  const [proximosConFlyerAll, pasadosAll, seasons, activeSeason, proximaExperience] =
    await Promise.all([
      getFechasProximasConFlyer(),
      getFechasPasadas(),
      getSeasons(),
      getActiveSeason(),
      getProximaFechaEspecial(),
    ]);

  const seasonBySlug = new Map(seasons.map((s) => [s.slug, s]));
  const { current: startedSeason } = getIntroSeasons(seasons);
  const proximosConFlyer = proximosConFlyerAll.slice(0, 6);
  const pasados = pasadosAll.slice(0, 6);
  const heroSeason = startedSeason ?? activeSeason;
  const proximaExperienceSeason = proximaExperience
    ? seasonBySlug.get(proximaExperience.seasonSlug)
    : undefined;
  const experienceParagraph = experienceCopy(
    proximaExperienceSeason?.nombre,
    proximaExperience?.lineup?.[0]?.artistas?.[0],
    proximaExperience?.tragoAutor?.nombre,
  );
  // Season que ilustra la banda Experience: la de la próxima fecha especial
  // si hay una cargada, si no la Season activa del sitio (mismo fallback
  // que el copy de arriba).
  const experienceSeason = proximaExperienceSeason ?? activeSeason;
  const experienceColors = experienceSeason ? getSeasonColors(experienceSeason) : null;
  // Se filtra por URL parseable y no sólo por "hay algo cargado": una URL
  // que no parsea hace que VideoPlayer devuelva null, y la sección quedaría
  // con un hueco en vez de caer al estado vacío. Las Server Actions ya
  // validan al guardar; esto cubre filas editadas a mano en la base.
  const aftermovieUrl =
    experienceSeason?.aftermovieUrl && isVideoUrl(experienceSeason.aftermovieUrl)
      ? experienceSeason.aftermovieUrl
      : null;
  // FORMAT Lab muestra los clips de la Season ACTIVA (no la de la próxima
  // Experience): son los DJs que están tocando este mes.
  const labSeason = activeSeason;
  const labColors = labSeason ? getSeasonColors(labSeason) : null;
  const labClips = (labSeason?.labClips ?? []).filter((c) => isVideoUrl(c.url));

  return (
    <>
      <Nav />
      {heroSeason ? (
        <Hero season={heroSeason} />
      ) : (
        <header className="flex min-h-[40vh] items-center justify-center border-b border-line bg-paper text-center">
          <p className="text-muted">Todavía no hay Seasons cargadas.</p>
        </header>
      )}

      {/* PRÓXIMOS VIERNES — slider de posters, sólo fechas con flyer cargado */}
      {proximosConFlyer.length > 0 && (
        <section id="proximos" className={`bg-ink text-white ${sectionPad}`}>
          <div className={wrap}>
            <HomeReveal><SectionTitle title="Próximos eventos" moreHref="/proximas-fechas" dark /></HomeReveal>
            <HomeReveal className="slider" staggered>
              {proximosConFlyer.map((f) => {
                const season = seasonBySlug.get(f.seasonSlug);
                if (!season) return null;
                return (
                  <PosterCard
                    key={`${f.seasonSlug}-${f.fecha}`}
                    fecha={f}
                    season={season}
                    dark
                  />
                );
              })}
            </HomeReveal>
          </div>
        </section>
      )}

      {/* EDICIONES ANTERIORES — slider con fotos de la puesta en escena */}
      <section id="archivo" className={sectionPad}>
        <div className={wrap}>
          <HomeReveal><SectionTitle
            title="Ediciones anteriores"
            moreHref="/calendario"
            moreLabel="Ver calendario"
          /></HomeReveal>
          {pasados.length > 0 ? (
            <HomeReveal className="slider" staggered>
              {pasados.map((f) => {
                const season = seasonBySlug.get(f.seasonSlug);
                if (!season) return null;
                return (
                  <ArchiveCard
                    key={`${f.seasonSlug}-${f.fecha}`}
                    fecha={f}
                    season={season}
                  />
                );
              })}
            </HomeReveal>
          ) : (
            <p className="text-sm text-muted">
              {/* Todavía no hay ediciones anteriores. */}
              Próximamente...
            </p>
          )}
        </div>
      </section>

      {/* FORMAT EXPERIENCE — banda ink, copy corto, link a página propia */}
      <section id="experience" className={`bg-ink text-paper ${sectionPad}`}>
        <div className={wrap}>
          <HomeReveal><SectionTitle title="FORMAT Experience" dark /></HomeReveal>
          <div className="grid items-center gap-[clamp(28px,5vw,76px)] md:items-start md:grid-cols-[minmax(0,0.85fr)_minmax(360px,1.15fr)]">
            <HomeReveal staggered>
              <h3 className="m-0 text-[clamp(30px,4.6vw,56px)] font-extrabold leading-none tracking-[-0.025em]">
                Nuestro evento
                <br />
                estrella del mes.
              </h3>
              <p className="mt-5 max-w-[38ch] text-[17px] text-paper/70">
                {experienceParagraph}
              </p>
              <Link
                href="/experience"
                className="label-mono mt-6 inline-flex items-center gap-1.5 bg-accent-1 px-[22px] py-3.5 text-paper motion-safe:transition-transform motion-safe:hover:-translate-y-1 motion-safe:hover:-rotate-1 hover:bg-paper hover:text-ink"
              >
                Ver Experience
              </Link>
            </HomeReveal>
            {/* AFTERMOVIE — vertical 9:16. Ancho completo de la columna en
                mobile; en desktop se acota por ALTO (no por ancho) para que
                el 9:16 no estire la banda entera. */}
            {experienceSeason && aftermovieUrl && experienceColors ? (
              <VideoPlayer
                url={aftermovieUrl}
                titulo={experienceSeason.nombre}
                kicker="Aftermovie"
                forma={experienceSeason.forma}
                accent={experienceColors[0]}
                posterSrc="/images/aftermovie-portada.png"
                className="mx-auto w-full md:-mt-[62px] md:max-w-[calc(min(92svh,980px)*9/16)]"
              />
            ) : (
              <div className="relative mx-auto flex aspect-[9/16] w-full flex-col items-center justify-center gap-4 overflow-hidden border border-paper/15 bg-ink md:-mt-[62px] md:max-w-[calc(min(92svh,980px)*9/16)]">
                {/* Misma trama que el poster del player: el hueco lee como
                    fotocopia y no como un rectángulo negro vacío. */}
                {experienceColors && (
                  <span
                    aria-hidden
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage: `radial-gradient(${experienceColors[0]} 1px, transparent 1.2px), radial-gradient(${experienceColors[0]} 1px, transparent 1.2px)`,
                      backgroundSize: "9px 9px",
                      backgroundPosition: "0 0, 4.5px 4.5px",
                    }}
                  />
                )}
                {experienceColors && (
                  <ShapeSticker
                    forma={experienceSeason?.forma ?? "square"}
                    color={experienceColors[0]}
                    size={132}
                    rotate={-6}
                    className="relative"
                    withLogo
                  />
                )}
                <p className="relative max-w-[22ch] px-6 text-center text-sm text-paper/60">
                  El aftermovie de esta Season todavía no está listo.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FORMAT LAB — clips de video de la Season activa, uno por DJ.
          Mismo player que el aftermovie: poster propio, el iframe recién
          se monta al apretar play. */}
      {false && <>
      <section id="lab" className={sectionPad}>
        <div className={wrap}>
          <HomeReveal><SectionTitle title="FORMAT Lab" /></HomeReveal>
          <p className="-mt-4 mb-6 text-[15px] text-muted">
            Los DJs de la Season, en corto.
          </p>
          {labSeason && labColors && labClips.length > 0 ? (
            <HomeReveal className="grid gap-4 sm:grid-cols-2 md:grid-cols-3" staggered>
              {labClips.map((clip, i) => (
                <VideoPlayer
                  // `orden` no tiene unique en la base: se combina con la
                  // URL para que la key no colisione entre dos clips.
                  key={`${clip.orden}-${clip.url}`}
                  url={clip.url}
                  titulo={clip.titulo || `Clip ${i + 1}`}
                  kicker={labSeason.nombre}
                  forma={labSeason.forma}
                  accent={labColors[0]}
                />
              ))}
            </HomeReveal>
          ) : (
            <p className="text-sm text-muted">
              Todavía no hay clips de esta Season.
            </p>
          )}
        </div>
      </section>

      {/* Identidad iniciada y el único adelanto autorizado: Origin → Ascent. */}
      </>}
      <WhatIsFormat
        activa={
          startedSeason
            ? {
                numero: startedSeason.numero,
                nombre: startedSeason.nombre,
                forma: startedSeason.forma,
                color: getSeasonColors(startedSeason)[0],
              }
            : null
        }
        className="border-t border-line py-[clamp(36px,4vw,60px)]"
        wrapClassName={wrap}
      />

      {/*
        FORMAT SPECIAL — eventos fuera de JET. Página futura; fuera de la home
        y de la navegación por ahora. Se reactiva cuando exista /special.

        <section id="special" className={sectionPad}>
          <div className={wrap}>
            <SectionTitle title="FORMAT Special" moreHref="/special" />
            <p className="text-muted">FORMAT fuera de JET.</p>
          </div>
        </section>
      */}

      <Footer />
    </>
  );
}
