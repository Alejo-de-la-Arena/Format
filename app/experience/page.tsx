import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ActionIcon from "@/components/ActionIcon";
import EventGallery from "@/components/EventGallery";
import EventImage from "@/components/EventImage";
import ShapeSticker from "@/components/ShapeSticker";
import TapeBlock from "@/components/TapeBlock";
import HomeReveal from "@/components/home/HomeReveal";
import { getFechasEspeciales } from "@/lib/data/fechas";
import { getActiveSeason, getSeasons } from "@/lib/data/seasons";
import { esPasado, fechaLarga, rangoHorario } from "@/lib/dates";
import { getSeasonColors } from "@/lib/season-colors";
import { seasonAccentVars } from "@/lib/theme";
import styles from "./experience.module.css";

export const metadata: Metadata = {
  title: "FORMAT Experience — Av. Costanera Rafael Obligado 4801",
  description: "La noche que abre cada Season de FORMAT: lineup, cocktail de autor y fotos de la Experience.",
};

export const revalidate = 300;
const venue = "Av. Costanera Rafael Obligado 4801";

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

  return <div style={seasonAccentVars(featuredSeason) as CSSProperties}>
    <Nav />
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroStickers} aria-hidden>
          <ShapeSticker forma={featuredSeason.forma} color={colors[0]} size={180} rotate={-17} opacity={0.9} />
          <ShapeSticker forma={featuredSeason.forma} color={colors[0]} size={128} rotate={12} opacity={0.58} />
        </div>
        <div className={styles.heroCopy}>
          <TapeBlock as="p" edge={1} rotate={-1.2} className={styles.kicker}>FORMAT Experience · {isUpcoming ? "Próxima fecha" : "Última edición"}</TapeBlock>
          <h1>FORMAT <span>Experience</span></h1>
          <p className={styles.heroLead}>Una vez por temporada, FORMAT concentra la apertura: una fecha especial, un cocktail propio y un line-up que marca el arranque.</p>
          <Link href={featuredHref} className={styles.heroLink}>Ver {featuredSeason.nombre} <ActionIcon kind="forward" /></Link>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.heroPhoto}><EventImage src={heroImage} alt={`Experience ${featuredSeason.nombre} · ${fechaLarga(featured.fecha)}`} colors={colors} forma={featuredSeason.forma} label="Experience" sizes="(max-width: 800px) 100vw, 48vw" variant="shot" /></div>
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

      <HomeReveal><section className={styles.featured} aria-labelledby="edicion-destacada">
        <details open className={styles.featuredDetails}>
          <summary className={styles.featuredHead}>
            <div className={styles.featuredTitleBlock}>
              <p className="label-mono">{isUpcoming ? "Próxima Experience" : "Experience más reciente"}</p>
              <div className={styles.featuredTitleLine}>
                <h2 id="edicion-destacada">{featuredSeason.nombre}</h2>
              </div>
            </div>
            <span className={styles.toggle}><span>Ver información</span><span className={styles.toggleIcon} aria-hidden><span>+</span><span>×</span></span></span>
            <div className={styles.featuredSummaryAside}>
              <p>{fechaLarga(featured.fecha)} · {venue}</p>
            </div>
          </summary>
          <div className={styles.featuredContent}>
            <div className={styles.featuredContentInner}>
            <div className={styles.featuredGrid}>
          <Link href={featuredHref} className={styles.flyer} aria-label={`Ver Experience ${featuredSeason.nombre}`}><EventImage src={featured.flyer} alt={`Flyer de ${featuredSeason.nombre}`} colors={colors} forma={featuredSeason.forma} label="Flyer" sizes="(max-width: 800px) 90vw, 33vw" fit="contain" /></Link>
          <div className={styles.details}>
            <div className={styles.detailRow}><span>Formato</span><strong>Opening / Experience</strong></div>
            {rangoHorario(featured.horaInicio, featured.horaFin) && <div className={styles.detailRow}><span>Horario</span><strong>{rangoHorario(featured.horaInicio, featured.horaFin)}</strong></div>}
            {featured.tragoAutor && <div className={styles.detailRow}><span>Cocktail</span><strong>{featured.tragoAutor.nombre}</strong></div>}
            <Link href={featuredHref} className={styles.detailLink}>Ver la fecha <ActionIcon kind="forward" /></Link>
          </div>
            </div>
            <section className={styles.gallery} aria-labelledby="galeria-experience">
            <div className={styles.galleryHeading}><p className="label-mono">Registro de la noche</p><h2 id="galeria-experience">Esto fue {featuredSeason.nombre}</h2></div>
            <EventGallery fotos={(featured.galeria ?? []).map((src, index) => ({ src, alt: `${featuredSeason.nombre} · foto ${index + 1} · ${fechaLarga(featured.fecha)}` }))} colors={colors} forma={featuredSeason.forma} />
            </section>
            </div>
          </div>
        </details>
      </section></HomeReveal>

      {archive.length > 0 && <HomeReveal><section className={styles.archive} aria-labelledby="archivo-experience">
        <div className={styles.archiveHeading}><p className="label-mono">Archivo</p><h2 id="archivo-experience">Más Experiences.</h2></div>
        <div className={styles.archiveGrid}>{archive.map((fecha) => {
          const season = seasonBySlug.get(fecha.seasonSlug);
          if (!season) return null;
          return <details key={fecha.fecha} className={styles.archiveDetails}>
            <summary className={styles.archiveCard}>
              <div className={styles.archiveImage}><EventImage src={fecha.fotoEscena ?? fecha.flyer} alt={`Experience ${season.nombre}`} colors={getSeasonColors(season)} forma={season.forma} label="Experience" sizes="(max-width: 700px) 90vw, 25vw" variant="shot" /></div>
              <span>{fechaLarga(fecha.fecha)}</span><strong>{season.nombre}</strong><ActionIcon kind="forward" />
            </summary>
            <div className={styles.archiveExpanded}>
              <p>Opening / Experience · {venue}</p>
              {fecha.tragoAutor && <p><strong>Cocktail:</strong> {fecha.tragoAutor.nombre}</p>}
              <Link href={`/eventos/${season.slug}?fecha=${fecha.fecha}`} className={styles.detailLink}>Ver la fecha <ActionIcon kind="forward" /></Link>
              <EventGallery fotos={(fecha.galeria ?? []).map((src, index) => ({ src, alt: `${season.nombre} · foto ${index + 1} · ${fechaLarga(fecha.fecha)}` }))} colors={getSeasonColors(season)} forma={season.forma} />
            </div>
          </details>;
        })}</div>
      </section></HomeReveal>}

      <section className={styles.closing}><p><span className={styles.closingLead}>La próxima <span className={styles.closingContinuation}>está por venir,</span></span> <span className={styles.closingHighlight}>Te esperamos.</span></p><Link href="/proximas-fechas">Ver próximas fechas <ActionIcon kind="forward" /></Link></section>
    </main>
    <Footer />
  </div>;
}
