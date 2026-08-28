import Link from "next/link";
import HomeReveal from "@/components/home/HomeReveal";
import InstagramLink from "@/components/InstagramLink";
import { getSeasonColors } from "@/lib/season-colors";
import { fechaCorta, fechaLarga, rangoHorario } from "@/lib/dates";
import { EXTERNAL_LINK, SOCIAL } from "@/lib/social";
import type { Fecha, Season } from "@/lib/types";
import type { CSSProperties } from "react";
import AgendaMasthead from "./AgendaMasthead";
import AgendaFlyer from "./AgendaFlyer";
import styles from "./agenda.module.css";

const VENUE = "Av. Costanera Rafael Obligado 4801";
const month = (iso: string) => new Intl.DateTimeFormat("es-AR", { month: "long", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));

function DateList({ fechas, seasons }: { fechas: Fecha[]; seasons: Map<string, Season> }) {
  return <ul className={styles.dateList}>{fechas.map((f) => {
    const season = seasons.get(f.seasonSlug);
    if (!season) return null;
    return <li key={f.fecha}><Link href={`/eventos/${season.slug}?fecha=${f.fecha}`} className={styles.dateRow}
      style={{ "--date-accent": getSeasonColors(season)[0] } as CSSProperties}>
      <time dateTime={f.fecha} className={styles.rowDate}><strong>{f.fecha.slice(8)}</strong><span>{month(f.fecha).slice(0,3)} / {f.fecha.slice(0,4)}</span></time>
      <span className={styles.rowName}><strong>{season.nombre}</strong><small>{f.especial ? "Experience" : "Residence"}</small>
        {f.horaInicio && <small>{rangoHorario(f.horaInicio, f.horaFin)}</small>}</span>
      <div className={styles.rowImage}><AgendaFlyer fecha={f} season={season} /></div>
      <span className={styles.rowArrow} aria-hidden>↗</span>
    </Link></li>;
  })}</ul>;
}

/** Shared presentation keeps empty/upcoming states testable without DB writes. */
export default function DatesView({ proximas, pasadas, seasons, activeSeason }: {
  proximas: Fecha[]; pasadas: Fecha[]; seasons: Season[]; activeSeason: Season | null;
}) {
  const seasonBySlug = new Map(seasons.map((s) => [s.slug, s]));
  const upcoming = proximas.filter((f) => seasonBySlug.has(f.seasonSlug)).sort((a,b) => a.fecha.localeCompare(b.fecha));
  const previous = pasadas.filter((f) => seasonBySlug.has(f.seasonSlug)).sort((a,b) => b.fecha.localeCompare(a.fecha));
  const destacado = upcoming[0];
  const season = destacado ? seasonBySlug.get(destacado.seasonSlug)! : null;
  return <main className={styles.page}>
    <AgendaMasthead title="Próximas" emphasis="Fechas" label="Agenda" note="El próximo encuentro en la terraza." href="/archivo" link="Ver calendario" forma={activeSeason?.forma} />
    {destacado && season ? <>
      <section className={styles.feature} aria-label={`Próximo evento: ${season.nombre}`} style={{ "--date-accent": getSeasonColors(season)[0] } as CSSProperties}>
        <HomeReveal className={styles.featureImage}>
          <Link href={`/eventos/${season.slug}?fecha=${destacado.fecha}`} aria-label={`Ver ${season.nombre} — ${fechaCorta(destacado.fecha)}`}>
            <AgendaFlyer fecha={destacado} season={season} priority />
          </Link>
        </HomeReveal>
        <HomeReveal className={styles.featureCopy}>
          <p className={styles.eyebrow}>Próximo viernes / {destacado.especial ? "Experience" : "Residence"}</p>
          <time dateTime={destacado.fecha} className={styles.dateDisplay} aria-label={fechaLarga(destacado.fecha)}>
            <strong>{destacado.fecha.slice(8)}</strong><span><span>{month(destacado.fecha)}</span><span>{destacado.fecha.slice(0,4)}</span></span>
          </time>
          <h2>{season.nombre}</h2>
          <div className={styles.featureMeta}><span>FORMAT {season.numero}</span>
            {destacado.horaInicio && <span>{rangoHorario(destacado.horaInicio,destacado.horaFin)}</span>}
            <span>{VENUE}</span></div>
          {Boolean(destacado.lineup?.length) && <ul className={styles.lineup}>{destacado.lineup!.map((slot) => <li key={slot.orden}>{slot.artistas.join(" b2b ")}</li>)}</ul>}
          <Link className={styles.cta} href={`/eventos/${season.slug}?fecha=${destacado.fecha}`}>Ver evento <span aria-hidden>↗</span></Link>
        </HomeReveal>
      </section>
      {upcoming.length > 1 && <section aria-label="Agenda">
        <div className={styles.sectionHeading}><h2>Después, seguimos.</h2><span>{upcoming.length - 1} fechas</span></div>
        <DateList fechas={upcoming.slice(1)} seasons={seasonBySlug} />
      </section>}
    </> : <>
      <HomeReveal className={styles.empty}>
        <p className={styles.eyebrow}>La próxima, pronto.</p>
        <h2>Aún no hay más fechas anunciadas.</h2>
        <p>Las novedades del próximo viernes, en nuestro Instagram.</p>
        <a href={SOCIAL.instagram} {...EXTERNAL_LINK} className={styles.emptyLink}>Seguí las novedades <span aria-hidden>↗</span></a>
      </HomeReveal>
      {previous.length > 0 && <details className={styles.past}>
        <summary>Ver fechas anteriores <span aria-hidden>+</span></summary>
        <DateList fechas={previous} seasons={seasonBySlug} />
      </details>}
    </>}
    <div className={styles.bottomRail}><Link href="/archivo">Las noches que ya pasaron <span aria-hidden>↗</span></Link><InstagramLink /></div>
  </main>;
}
