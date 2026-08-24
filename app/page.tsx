import Link from "next/link";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import SectionTitle from "@/components/SectionTitle";
import PosterCard from "@/components/PosterCard";
import ArchiveCard from "@/components/ArchiveCard";
import ShapeSticker from "@/components/ShapeSticker";
import SeasonShowcase from "@/components/SeasonShowcase";
import Carousel from "@/components/Carousel";
import {
  getFechasProximas,
  getFechasProximasConFlyer,
  getFechasPasadas,
  getProximaFechaEspecial,
} from "@/lib/data/fechas";
import { getSeasons, getActiveSeason } from "@/lib/data/seasons";
import { getSeasonColors } from "@/lib/season-colors";

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
  const [proximos, proximosConFlyerAll, pasadosAll, seasons, activeSeason, proximaExperience] =
    await Promise.all([
      getFechasProximas(),
      getFechasProximasConFlyer(),
      getFechasPasadas(),
      getSeasons(),
      getActiveSeason(),
      getProximaFechaEspecial(),
    ]);

  const seasonBySlug = new Map(seasons.map((s) => [s.slug, s]));
  const proximosConFlyer = proximosConFlyerAll.slice(0, 6);
  const pasados = pasadosAll.slice(0, 6);
  const destacado = proximos[0];
  const heroSeason = destacado
    ? (seasonBySlug.get(destacado.seasonSlug) ?? activeSeason)
    : activeSeason;
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
        <section id="proximos" className={sectionPad}>
          <div className={wrap}>
            <SectionTitle title="Próximos eventos" moreHref="/fechas" />
            <div className="slider">
              {proximosConFlyer.map((f) => {
                const season = seasonBySlug.get(f.seasonSlug);
                if (!season) return null;
                return (
                  <PosterCard
                    key={`${f.seasonSlug}-${f.fecha}`}
                    fecha={f}
                    season={season}
                  />
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* EDICIONES ANTERIORES — slider con fotos de la puesta en escena */}
      <section id="archivo" className={sectionPad}>
        <div className={wrap}>
          <SectionTitle
            title="Ediciones anteriores"
            moreHref="/archivo"
            moreLabel="Ver archivo →"
          />
          {pasados.length > 0 ? (
            <div className="slider">
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
            </div>
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
          <SectionTitle title="FORMAT Experience" dark />
          <div className="grid items-center gap-[clamp(24px,4vw,60px)] md:grid-cols-[1.1fr_0.9fr]">
            <div>
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
                className="label-mono mt-6 inline-flex items-center gap-1.5 bg-accent-1 px-[22px] py-3.5 text-paper transition-colors hover:bg-paper hover:text-ink"
              >
                Ver Experience
              </Link>
            </div>
            {experienceSeason && experienceSeason.sliderPhotos.length > 0 ? (
              <Carousel
                items={experienceSeason.sliderPhotos.map((src, i) => ({
                  id: `${experienceSeason.slug}-${i}`,
                  src,
                  alt: `Foto ${i + 1} de ${experienceSeason.nombre}`,
                }))}
                accent={experienceColors?.[0]}
              />
            ) : (
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink">
                {experienceColors && (
                  <ShapeSticker
                    forma={experienceSeason?.forma ?? "square"}
                    color={experienceColors[0]}
                    size={140}
                    rotate={-6}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    withLogo
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FORMAT LAB */}
      <section id="lab" className={sectionPad}>
        <div className={wrap}>
          <SectionTitle title="FORMAT Lab" moreHref="/lab" moreLabel="Ver todo →" />
          <p className="-mt-4 mb-6 text-[15px] text-muted">
            Explorá sets de nuestros eventos anteriores.
          </p>
          {pasados.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-3">
              {pasados.map((f) => {
                const season = seasonBySlug.get(f.seasonSlug);
                if (!season) return null;
                const colors = getSeasonColors(season);
                return (
                  <a
                    key={`${f.seasonSlug}-${f.fecha}`}
                    href={f.youtube ?? "#"}
                    className="group border border-line bg-paper-2 transition-colors hover:border-accent-1"
                  >
                    <div className="relative aspect-video overflow-hidden bg-paper-2">
                      <div
                        className="h-full w-full"
                        style={{
                          background: `radial-gradient(80% 100% at 50% 0%, color-mix(in srgb, ${colors[2]} 55%, var(--color-paper-2)), var(--color-paper-2) 75%)`,
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg
                          viewBox="0 0 44 44"
                          className="h-11 w-11 text-ink opacity-80"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          aria-hidden
                        >
                          <circle cx="22" cy="22" r="20" />
                          <path d="M18 15 L30 22 L18 29 Z" fill="currentColor" stroke="none" />
                        </svg>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="text-base font-bold">
                        {season.nombre} — Set completo
                      </div>
                      <div className="label-mono mt-1 text-muted">YouTube</div>
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted">Todavía no hay sets publicados.</p>
          )}
        </div>
      </section>

      {/* QUÉ ES FORMAT — corto, al final. El fondo y los colores de la pieza
          son locales a esta sección: el resto de la home no se entera. */}
      <SeasonShowcase
        className={`border-t border-line ${sectionPad}`}
        wrapClassName={wrap}
      >
        <SectionTitle title="Qué es FORMAT" />
        <div className="max-w-[24ch] text-[clamp(22px,2.6vw,30px)] font-bold leading-[1.25] tracking-tight">
          Cada viernes, Av. Costanera Rafael Obligado 4801 cambia por completo.
        </div>
        <p className="mt-4 max-w-[52ch] text-[15px] text-muted">
          Música electrónica curada, escenografía propia y un cocktail para cada
          edición.
        </p>
      </SeasonShowcase>

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
