import type { Season } from "./types";
import { isVideoUrl } from "./embed";

/** Prefer the current video, otherwise the most recent earlier Season with one. */
export function getAftermovieSeason(current: Season | null, seasons: Season[]): Season | null {
  if (!current) return null;
  if (current.aftermovieUrl && isVideoUrl(current.aftermovieUrl)) return current;
  return [...seasons]
    .filter(s => s.fechaInicio < current.fechaInicio && s.aftermovieUrl && isVideoUrl(s.aftermovieUrl))
    .sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio))[0] ?? null;
}

export function seasonDisplayName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}
