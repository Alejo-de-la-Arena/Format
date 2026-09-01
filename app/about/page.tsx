import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import TapeBlock from "@/components/TapeBlock";
import { getShapePath } from "@/components/shapePaths";
import { getSeasons, getActiveSeason } from "@/lib/data/seasons";
import { getFechasEspeciales } from "@/lib/data/fechas";
import { seasonAccentVars } from "@/lib/theme";
import type { Cocktail, Season } from "@/lib/types";
import AboutReveal from "./AboutReveal";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "About — FORMAT",
  description: "Qué es FORMAT: el ciclo semanal en la terraza de JET y el sistema de Seasons.",
};

export const revalidate = 300;

/**
 * BLOQUE A — identidad general de FORMAT. Hardcodeado a propósito: es la
 * definición de marca, no cambia por Season. BORRADOR sujeto a corrección
 * del cliente — editar acá cuando llegue la versión final.
 */
const IDENTIDAD: { titulo: string; cuerpo: string }[] = [
  {
    titulo: "FORMAT",
    cuerpo:
      "Un ciclo de música electrónica, todos los viernes, en la terraza de JET — Av. Costanera Rafael Obligado 4801, Buenos Aires.",
  },
  {
    titulo: "Seasons",
    cuerpo:
      "FORMAT no piensa en fechas sueltas sino en Seasons. Una Season es un mes: varios viernes bajo una misma identidad. El primer viernes es el Opening —la noche Experience—, con escenografía completa, invitado y cocktail propio; los viernes que siguen son Residence, la misma identidad en formato semanal.",
  },
  {
    titulo: "Cada Season, un mundo",
    cuerpo:
      "Cada Season trae su forma, su color, su escenografía y su trago. Una forma ancla la identidad; el color la tiñe entera; la escenografía cambia la terraza por completo; el trago de autor la vuelve algo que se prueba. Cuando la Season termina, no vuelve: empieza otra.",
  },
];


/** Keep the original string, including every editorial newline; only emphasize its opening. */
function Prosa({ texto, className = "" }: { texto: string; className?: string }) {
  if (!texto.trim()) return null;
  const separator = texto.search(/\r?\n[ \t]*\r?\n/);
  const end = separator < 0 ? texto.length : separator;
  return (
    <p className={`${styles.prose} ${className}`} data-about-copy>
      {end <= 160 ? <><strong>{texto.slice(0, end)}</strong>{texto.slice(end)}</> : texto}
    </p>
  );
}

/** Render only the current Season's path on the server, not a catalogue of future forms. */
function PrintedForm({ season, className = "" }: { season: Season; className?: string }) {
  const path = getShapePath(season.forma, season.slug);
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 100 100" className={className}>
      <g transform="translate(14 14)">
        <path d={path} fill="none" stroke="currentColor" strokeWidth="0.35" transform="rotate(12 36 36)" />
        <path d={path} fill="currentColor" transform="rotate(-7 36 36)" />
        <path d={path} fill="none" stroke="var(--color-paper)" strokeWidth="0.45" transform="translate(-3 -3) rotate(-7 36 36)" />
      </g>
    </svg>
  );
}

function SeasonBlock({ season, trago }: { season: Season; trago?: Cocktail }) {
  const tieneAbout = season.about.relato || season.about.colorDescripcion || season.about.formaDescripcion;
  return (
    <section
      className={styles.season}
      style={seasonAccentVars(season)}
      aria-labelledby={`season-${season.slug}`}
      data-season={season.slug}
    >
      <div className={styles.wrap}>
        <AboutReveal>
          <header className={styles.seasonHeading}>
            <div className={styles.seasonTitle}>
              <p className={styles.eyebrow}>FORMAT {season.numero}</p>
              <h3 id={`season-${season.slug}`}>{season.nombre}</h3>
              {season.concepto && <p className={styles.concept} data-about-copy>{season.concepto}</p>}
            </div>
            <PrintedForm season={season} className={styles.seasonMark} />
          </header>
        </AboutReveal>

        {season.about.relato && (
          <AboutReveal className={styles.story}>
            <span aria-hidden="true" className={styles.storyNumber}>{season.numero}</span>
            <Prosa texto={season.about.relato} className={styles.storyText} />
          </AboutReveal>
        )}

        {(season.about.colorDescripcion || season.about.formaDescripcion) && (
          <div className={styles.details}>
            {season.about.colorDescripcion && (
              <AboutReveal className={styles.colorPanel}>
                <section aria-labelledby={`color-${season.slug}`} className={styles.colorPaper}>
                  <div aria-hidden="true" className={styles.inkPrint} />
                  <TapeBlock as="h4" rotate={-1.5} className={styles.smallTape}>
                    <span id={`color-${season.slug}`}>El color</span>
                  </TapeBlock>
                  <Prosa texto={season.about.colorDescripcion} />
                </section>
              </AboutReveal>
            )}
            {season.about.formaDescripcion && (
              <AboutReveal className={styles.formPanel} delay={0.08}>
                <section aria-labelledby={`form-${season.slug}`}>
                  <div className={styles.formHeading}>
                    <h4 id={`form-${season.slug}`} className={styles.eyebrow}>La forma</h4>
                    <PrintedForm season={season} className={styles.smallForm} />
                  </div>
                  <Prosa texto={season.about.formaDescripcion} />
                </section>
              </AboutReveal>
            )}
          </div>
        )}

        {trago && (
          <AboutReveal className={styles.drink}>
            <section aria-labelledby={`drink-${season.slug}`} className={styles.drinkPaper}>
              <div className={styles.drinkLabel}>
                <h4 id={`drink-${season.slug}`} className={styles.eyebrow}>El trago</h4>
                <svg aria-hidden="true" focusable="false" viewBox="0 0 80 100" className={styles.glass}>
                  <path d="M12 12 H68 L40 49 Z M40 49 V85 M22 86 H58" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M21 24 H59 L40 43 Z" fill="currentColor" opacity=".3" />
                  <path d="M51 8 L61 32" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <div>
                <p className={styles.drinkName} data-about-copy>{trago.nombre}</p>
                {trago.descripcion && <p className={styles.drinkDescription} data-about-copy>{trago.descripcion}</p>}
              </div>
            </section>
          </AboutReveal>
        )}

        {!tieneAbout && !trago && (
          <p className={styles.empty}>El contenido de esta Season se está cargando.</p>
        )}
      </div>
    </section>
  );
}

export default async function AboutPage() {
  const [seasons, especiales, activeSeason] = await Promise.all([
    getSeasons(), getFechasEspeciales(), getActiveSeason(),
  ]);

  // The cocktail remains sourced exclusively from this Season's Experience.
  const tragoBySeason = new Map<string, Cocktail>();
  for (const f of especiales) {
    if (f.tragoAutor && !tragoBySeason.has(f.seasonSlug)) {
      tragoBySeason.set(f.seasonSlug, f.tragoAutor);
    }
  }

  // Exact slices of the existing copy, in its original reading order.
  const cadence = "FORMAT no piensa en fechas sueltas sino en Temporadas. Una Season es un mes: varios viernes bajo una misma identidad. El primer viernes es el Opening, la noche Experience, con escenografía completa, invitado y cocktail propio; Los viernes que siguen son Residence, la misma identidad en formato semanal.";
  const opening = cadence.indexOf("Una Season");
  const experience = cadence.indexOf("El primer viernes");
  const residence = cadence.indexOf("Los viernes");
  const world = "Cada Temporada trae su forma, su color, su escenografía y su trago. Una forma ancla la identidad; el color la tiñe entera; la escenografía cambia la terraza por completo; el trago de autor la vuelve algo que se prueba. Cuando termina, no vuelve: empieza otra.";
  const worldDetail = world.indexOf("Una forma");
  const worldClosing = world.indexOf("Cuando termina");

  return (
    <>
      <Nav />
      <main className={styles.page}>
        <section className={`${styles.wrap} ${styles.intro}`} aria-labelledby="about-title">
          <AboutReveal>
            <h1 id="about-title" className={styles.pageTitle}>
              Qué es <TapeBlock rotate={-1.5} className={styles.aboutTape}>FORMAT</TapeBlock>
            </h1>
          </AboutReveal>
          <div className={styles.introLayout}>
            <AboutReveal className={styles.introCopy}>
              <p data-about-copy>
                <span className={styles.introLead}>Un ciclo de música electrónica, todos los viernes, en la terraza de JET</span>
                <span className={styles.venue}>Av. Costanera Rafael Obligado 4801 · Buenos Aires</span>
              </p>
            </AboutReveal>
            {activeSeason && (
              <AboutReveal className={styles.introArt} delay={0.08}>
                <div className={styles.printSheet} aria-hidden="true">
                  <PrintedForm season={activeSeason} className={styles.introForm} />
                  <span className={styles.printCorner} />
                </div>
              </AboutReveal>
            )}
          </div>
        </section>

        <section className={`${styles.wrap} ${styles.cadence}`} aria-labelledby="seasons-title">
          <AboutReveal className={styles.chapterHeading}>
            <h2 id="seasons-title">{IDENTIDAD[1].titulo}</h2>
          </AboutReveal>
          <AboutReveal>
            <p className={styles.cadenceLead} data-about-copy>{cadence.slice(0, opening)}</p>
          </AboutReveal>
          <div className={styles.sequence}>
            {[cadence.slice(opening, experience), cadence.slice(experience, residence), cadence.slice(residence)].map((text, i) => (
              <AboutReveal key={i} delay={i * 0.06}>
                <div className={styles.sequenceStep}>
                  <span aria-hidden="true" className={styles.stepNumber}>{String(i + 1).padStart(2, "0")}</span>
                  <p data-about-copy>{text}</p>
                </div>
              </AboutReveal>
            ))}
          </div>
        </section>

        <section className={styles.world} aria-labelledby="world-title">
          <div className={styles.wrap}>
            <AboutReveal className={styles.chapterHeading}>
              <h2 id="world-title">Cada <span>Season</span> es un mundo.</h2>
            </AboutReveal>
            <div className={styles.worldLayout}>
              <AboutReveal>
                <p className={styles.worldLead} data-about-copy>{world.slice(0, worldDetail)}</p>
              </AboutReveal>
              <AboutReveal delay={0.08}>
                <p className={styles.worldDetail} data-about-copy>{world.slice(worldDetail, worldClosing)}</p>
                <p className={styles.worldClosing} data-about-copy>{world.slice(worldClosing)}</p>
              </AboutReveal>
            </div>
          </div>
        </section>

        {seasons.length > 0 && (
          <section aria-labelledby="real-seasons-title">
            <div className={`${styles.wrap} ${styles.seasonsDivider}`}>
              <h2 id="real-seasons-title"><TapeBlock rotate={-1.2}>Las Seasons</TapeBlock></h2>
              <span aria-hidden="true" className={styles.dividerLine} />
              <span aria-hidden="true" className={styles.eyebrow}>{String(seasons.length).padStart(2, "0")}</span>
            </div>
            {seasons.map((season) => <SeasonBlock key={season.slug} season={season} trago={tragoBySeason.get(season.slug)} />)}
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
