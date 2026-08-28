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

/** Never derives identities from a catalogue or a future Season. */
export function getIntroSeasons(seasons: Season[], today = buenosAiresDay()) {
  const started = seasons.filter((s) => s.fechaInicio <= today)
    .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio) || a.slug.localeCompare(b.slug));
  return { current: started.at(-1) ?? null, previous: started.at(-2) ?? null };
}

export function introCopy(season: Pick<Season, "nombre" | "intro">): string {
  return season.intro?.text.trim() || `WELCOME TO\n${season.nombre.toUpperCase() === "ORIGIN" ? "THE ORIGIN." : `${season.nombre.toUpperCase()}.`}`;
}

export function introStorageKey(season: Pick<Season, "slug" | "fechaInicio">): string {
  return `format:visit-intro:v2:${season.slug}:${season.fechaInicio}`;
}

export function shouldAutoIntro({ seen, reduced, returning }: {
  seen: boolean; reduced: boolean; returning: boolean;
}) {
  return !seen && !reduced && !returning;
}
