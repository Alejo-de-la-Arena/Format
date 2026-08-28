import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import HomeReveal from "@/components/home/HomeReveal";
import InstagramLink from "@/components/InstagramLink";
import AgendaMasthead from "@/components/agenda/AgendaMasthead";
import AgendaFlyer from "@/components/agenda/AgendaFlyer";
import styles from "@/components/agenda/agenda.module.css";
import { getFechasPasadas } from "@/lib/data/fechas";
import { getSeasons, getActiveSeason } from "@/lib/data/seasons";
import { getSeasonColors } from "@/lib/season-colors";
import { buenosAiresDay } from "@/lib/season-intro";
import { pastFridaysOf } from "@/lib/calendar";

export const metadata: Metadata = {
  title: "Calendario — FORMAT",
  description: "Los viernes de FORMAT que ya pasaron. Cada noche, su archivo.",
};
export const revalidate = 300;

export default async function ArchivoPage() {
  const [pasadas, seasons, activeSeason] = await Promise.all([getFechasPasadas(), getSeasons(), getActiveSeason()]);
  const today = buenosAiresDay();
  const seasonBySlug = new Map(seasons.map((s) => [s.slug, s]));
  const dates = pasadas.filter((f) => f.fecha < today && seasonBySlug.has(f.seasonSlug));
  const byDate = new Map(dates.map((f) => [f.fecha, f]));
  const months = [...new Set(dates.map((f) => f.fecha.slice(0,7)))].sort().reverse();
  return <><Nav /><main className={styles.page}>
    <AgendaMasthead title="Calendario" label="Archivo" note="Cada viernes deja algo. Volvé a esa noche." href="/fechas" link="Próximas fechas" forma={activeSeason?.forma} />
    {months.length ? months.map((ym) => {
      const [year, month] = ym.split("-").map(Number);
      const fridays = pastFridaysOf(year,month,today);
      const monthName = new Intl.DateTimeFormat("es-AR",{month:"long",timeZone:"UTC"}).format(new Date(`${ym}-01T12:00:00Z`));
      const count = dates.filter((f) => f.fecha.startsWith(ym)).length;
      return <section key={ym} className={styles.month} aria-label={`${monthName} ${year}`}>
        <HomeReveal className={styles.monthHeader}>
          <span aria-hidden className={styles.monthNumber}>{ym.slice(5)}</span>
          <div><h2 className="capitalize">{monthName}</h2><p>{year} / VIERNES</p></div>
          <span className={styles.monthCount}>{String(count).padStart(2,"0")} {count === 1 ? "noche" : "noches"}</span>
        </HomeReveal>
        <ul className={styles.calendarGrid} style={{"--friday-count": Math.max(fridays.length,1)} as CSSProperties}>
          {fridays.map((iso) => {
            const f = byDate.get(iso);
            const season = f && seasonBySlug.get(f.seasonSlug);
            const day = iso.slice(8);
            if (!f || !season) return <li key={iso} className={styles.noEvent}>
              <time dateTime={iso} className={styles.calendarDate}><strong>{day}</strong><span>Viernes</span></time>
              <p>Sin evento</p>
            </li>;
            return <li key={iso}><Link className={styles.calendarCard} href={`/eventos/${season.slug}?fecha=${iso}`}
              style={{"--date-accent": getSeasonColors(season)[0]} as CSSProperties}
              aria-label={`${season.nombre} — viernes ${Number(day)} de ${monthName} ${year}`}>
              <time dateTime={iso} className={styles.calendarDate}><strong>{day}</strong><span>Viernes</span></time>
              <div className={styles.calendarImage}><AgendaFlyer fecha={f} season={season} /></div>
              <span className={styles.calendarName}>{season.nombre}<span aria-hidden>↗</span></span>
              <span className={styles.calendarType}>{f.especial ? "Opening / Experience" : "Residence"}</span>
            </Link></li>;
          })}
        </ul>
      </section>;
    }) : <section className={styles.empty}>
      <p className={styles.eyebrow}>El archivo empieza con vos.</p>
      <h2>Todavía no hay ediciones anteriores.</h2>
      <Link href="/fechas" className={styles.emptyLink}>Ver las próximas fechas <span aria-hidden>↗</span></Link>
    </section>}
    <div className={styles.bottomRail}><Link href="/fechas">Nos vemos el próximo viernes <span aria-hidden>↗</span></Link><InstagramLink /></div>
  </main><Footer /></>;
}
