import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ActionIcon from "@/components/ActionIcon";
import BackButton from "@/components/BackButton";
import ExperienceArchive from "@/components/ExperienceArchive";
import EventImage from "@/components/EventImage";
import ShapeSticker from "@/components/ShapeSticker";
import TapeBlock from "@/components/TapeBlock";
import HomeReveal from "@/components/home/HomeReveal";
import { getFechasEspeciales } from "@/lib/data/fechas";
import { getActiveSeason, getSeasons } from "@/lib/data/seasons";
import { esPasado, fechaLarga } from "@/lib/dates";
import { getSeasonColors } from "@/lib/season-colors";
import { seasonAccentVars } from "@/lib/theme";
import styles from "./experience.module.css";

export const metadata: Metadata = {
  title: "FORMAT Experience — Av. Costanera Rafael Obligado 4801",
  description: "La noche que abre cada Season de FORMAT: lineup, cocktail de autor y fotos de la Experience.",
};

export const revalidate = 300;

export default async function ExperiencePage() {
  const [especiales, seasons, activeSeason] = await Promise.all([getFechasEspeciales(), getSeasons(), getActiveSeason()]);
  const seasonBySlug = new Map(seasons.map((season) => [season.slug, season]));
  const upcoming = especiales.filter((fecha) => !esPasado(fecha.fecha) && seasonBySlug.has(fecha.seasonSlug)).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const previous = especiales.filter((fecha) => esPasado(fecha.fecha) && seasonBySlug.has(fecha.seasonSlug)).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const featured = upcoming[0] ?? previous[0];
  const featuredSeason = featured ? seasonBySlug.get(featured.seasonSlug) : undefined;
  const archive = featured ? [...upcoming.slice(1), ...previous.filter((fecha) => fecha.fecha !== featured.fecha)] : [];
  const colors = featuredSeason ? getSeasonColors(featuredSeason) : null;

  if (!featured || !featuredSeason || !colors) {
    return <div style={seasonAccentVars(activeSeason)}><Nav /><main className={styles.empty}>
      <TapeBlock as="p" edge={2} className={styles.emptyKicker}>FORMAT Experience</TapeBlock>
      <h1>La próxima Experience, pronto.</h1><p>Cuando esté anunciada, la vas a encontrar acá.</p>
      <Link href="/proximas-fechas" className={styles.emptyLink}>Ver próximas fechas <ActionIcon kind="forward" /></Link>
    </main><Footer /></div>;
  }

  const isUpcoming = !esPasado(featured.fecha);
  const featuredHref = `/eventos/${featuredSeason.slug}?fecha=${featured.fecha}`;
  const heroImage = featured.fotoEscena ?? featured.galeria?.[0] ?? featured.flyer;
  const activeColors = activeSeason ? getSeasonColors(activeSeason) : null;

  return <div style={seasonAccentVars(activeSeason)}>
    <Nav showBackButton={false} />
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroBackButton}><BackButton /></div>
        <div className={styles.heroStickers} aria-hidden>
          {activeSeason && activeColors && <>
            <ShapeSticker forma={activeSeason.forma} color={activeColors[0]} size={180} rotate={-17} opacity={0.9} />
            <ShapeSticker forma={activeSeason.forma} color={activeColors[0]} size={128} rotate={12} opacity={0.58} />
          </>}
        </div>
        <div className={styles.heroCopy}>
          <TapeBlock as="p" edge={1} rotate={-1.2} className={styles.kicker}>FORMAT Experience · {isUpcoming ? "Próxima fecha" : "Última edición"}</TapeBlock>
          <h1>FORMAT <span>Experience</span></h1>
          <p className={styles.heroLead}>Una vez por temporada, FORMAT concentra la apertura: una fecha especial, un cocktail propio y un line-up que marca el arranque.</p>
          <Link href={featuredHref} className={styles.heroLink}>Ver {featuredSeason.nombre} <ActionIcon kind="forward" /></Link>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.heroPhoto}><EventImage src={heroImage} alt={`Experience ${featuredSeason.nombre} · ${fechaLarga(featured.fecha)}`} colors={colors} forma={featuredSeason.forma} label="Experience" sizes="(max-width: 800px) 88vw, 590px" variant="shot" fit="contain" priority /></div>
          <div className={styles.heroStamp}><strong>{featured.fecha.slice(8)}</strong><span>{fechaLarga(featured.fecha).replace(/^\w+\s+\d+\s/, "")}</span></div>
        </div>
      </section>

      <HomeReveal><section className={styles.reading} aria-labelledby="que-es-experience">
        <div className={styles.sectionIntro}><p className="label-mono">¿Qué es Experience?</p><h2 id="que-es-experience">El primer golpe de la Season.</h2></div>
        <div className={styles.principles}>
          <article><span>01</span><h3>Apertura</h3><p>El primer viernes de cada mes es el punto de partida de todo lo que sigue.</p></article>
          <article><span>02</span><h3>Música</h3><p>Line-up completo con DJs y artistas que convierten la terraza en algo distinto.</p></article>
          <article><span>03</span><h3>Cocktail</h3><p>Barra libre y trago de autor en cada opening de temporada.</p></article>
        </div>
      </section></HomeReveal>

      <section className={styles.archive} aria-labelledby="archivo-experience">
        <div className={styles.archiveHeading}><p className="label-mono">Archivo</p><h2 id="archivo-experience">Todas las Experiences.</h2></div>
        <ExperienceArchive entries={[featured, ...archive].flatMap((fecha) => {
          const season = seasonBySlug.get(fecha.seasonSlug);
          return season ? [{ fecha, season }] : [];
        })} />
      </section>

      <section className={styles.closing}><p><span className={styles.closingLead}>La próxima <span className={styles.closingContinuation}>está por venir,</span></span> <span className={styles.closingHighlight}>Te esperamos.</span></p><Link href="/proximas-fechas">Ver próximas fechas <ActionIcon kind="forward" /></Link></section>
    </main>
    <Footer />
  </div>;
}
