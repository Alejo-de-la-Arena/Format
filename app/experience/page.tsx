import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SectionTitle from "@/components/SectionTitle";
import PosterCard from "@/components/PosterCard";
import ArchiveCard from "@/components/ArchiveCard";
import { getFechasEspeciales } from "@/lib/data/fechas";
import { getSeasons } from "@/lib/data/seasons";
import { esPasado } from "@/lib/dates";

export const metadata: Metadata = {
  title: "FORMAT Experience — Av. Costanera Rafael Obligado 4801",
  description:
    "El evento estrella del mes: escenografía completa, cocktail propio y el mejor lineup. Una vez por mes en Av. Costanera Rafael Obligado 4801.",
};

const wrap = "mx-auto max-w-[1400px] px-[clamp(18px,4vw,48px)]";
const sectionPad = "py-[clamp(44px,5vw,72px)]";

export const revalidate = 300;

export default async function ExperiencePage() {
  const [especiales, seasons] = await Promise.all([
    getFechasEspeciales(),
    getSeasons(),
  ]);
  const seasonBySlug = new Map(seasons.map((s) => [s.slug, s]));

  const proxima = especiales.find((f) => !esPasado(f.fecha) && f.flyer);
  const anteriores = especiales.filter((f) => esPasado(f.fecha));
  const proximaSeason = proxima ? seasonBySlug.get(proxima.seasonSlug) : undefined;

  return (
    <>
      <Nav />

      <header className={`border-b border-line ${sectionPad}`}>
        <div
          className={`${wrap} text-center max-md:flex max-md:min-h-[60vh] max-md:flex-col max-md:items-center max-md:justify-center md:text-left`}
        >
          <p className="label-mono mb-3.5 text-muted">
            FORMAT Experience
          </p>
          <h1 className="m-0 max-w-[16ch] text-[clamp(40px,8vw,96px)] font-extrabold leading-[0.9] tracking-[-0.03em] max-md:mx-auto">
            El evento estrella del mes.
          </h1>
          <p className="mx-auto mt-5 max-w-[46ch] text-[clamp(15px,1.6vw,18px)] text-muted md:mx-0">
            Una vez por mes la terraza se transforma por completo en
            Av. Costanera Rafael Obligado 4801: escenografía total, cocktail
            de autor y el mejor lineup.
          </p>
        </div>
      </header>

      {proxima && proximaSeason && (
        <section className={sectionPad}>
          <div className={wrap}>
            <SectionTitle title="Próxima Experience" />
            <div className="slider">
              <PosterCard fecha={proxima} season={proximaSeason} />
            </div>
          </div>
        </section>
      )}

      {anteriores.length > 0 && (
        <section className={sectionPad}>
          <div className={wrap}>
            <SectionTitle title="Experiences anteriores" />
            <div className="slider">
              {anteriores.map((f) => {
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
          </div>
        </section>
      )}

      <Footer />
    </>
  );
}
