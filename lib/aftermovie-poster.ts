import type { Season } from "./types";

const LOCAL_POSTERS: Record<string, string> = {
  origin: "/images/aftermovie-portada.png",
  ascent: "/images/aftermovie-ascent-portada.jpg",
};

export function getAftermoviePoster(season: Pick<Season, "slug" | "aftermoviePosterUrl">): string | undefined {
  return season.aftermoviePosterUrl || (Object.hasOwn(LOCAL_POSTERS, season.slug) ? LOCAL_POSTERS[season.slug] : undefined);
}
