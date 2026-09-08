import type { Season } from "./types";

export const INTRO_MOTIONS = ["signal", "ascend", "expand"] as const;
export type IntroMotion = (typeof INTRO_MOTIONS)[number];

export function isIntroMotion(value: unknown): value is IntroMotion {
  return INTRO_MOTIONS.some((motion) => motion === value);
}

export function isIntroText(value: string): boolean {
  return value.length <= 160 && value.split(/\r?\n/).length <= 3;
}

/** Calendar dates are compared in the venue's timezone, never the server's. */
export function buenosAiresDay(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  return ["year", "month", "day"].map((part) => parts.find((p) => p.type === part)!.value).join("-");
}

/** Same active identity for the theme, hero and intro, including gaps. */
export function getIntroSeasons(seasons: Season[], today = buenosAiresDay()) {
  const ordered = [...seasons]
    .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio) || a.slug.localeCompare(b.slug));
  const current = ordered.find((s) => s.fechaInicio <= today && today <= s.fechaFin)
    ?? ordered.find((s) => s.fechaInicio > today) ?? ordered.at(-1) ?? null;
  const index = current ? ordered.indexOf(current) : -1;
  return { current, previous: ordered[index - 1] ?? null };
}

/** Compara copy editorial: sin mayúsculas ni puntuación de cierre. */
const sameLine = (a: string, b: string) =>
  a.trim().toLowerCase().replace(/[.·!?]+$/, "") === b.trim().toLowerCase().replace(/[.·!?]+$/, "");

/**
 * La bienvenida cargada en admin, o «Welcome to / Nombre» si está vacía.
 *
 * `leadShown` sólo es true cuando la intro hace el viaje y por lo tanto
 * muestra la frase del lead en su propio momento: ahí, si el texto la
 * repite como primera línea, se descarta o iría dos veces en pantalla.
 * Sin viaje no hay nada que duplicar y el texto va entero — descartarla
 * igual haría desaparecer en silencio una línea escrita a mano.
 */
export function introCopy(season: Pick<Season, "nombre" | "intro">, leadShown = false): string {
  const text = season.intro?.text.trim();
  if (!text) return `Welcome to\n${season.nombre}`;
  if (!leadShown) return text;
  const [first, ...rest] = text.split(/\r?\n/);
  return rest.length > 0 && sameLine(first, introLead(season))
    ? rest.join("\n").trim() || text
    : text;
}

export function introLead(season: Pick<Season, "nombre" | "intro">): string {
  return season.nombre.toLowerCase() === "ascent" || season.intro?.motion === "ascend"
    ? "It was time to ascend" : "It was time for a new Season";
}

export function introStorageKey(season: Pick<Season, "slug" | "fechaInicio">): string {
  return `format:visit-intro:v2:${season.slug}:${season.fechaInicio}`;
}

export function shouldAutoIntro({ seen, reduced, returning }: {
  seen: boolean; reduced: boolean; returning: boolean;
}) {
  return !seen && !reduced && !returning;
}
