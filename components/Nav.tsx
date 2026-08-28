import { getActiveSeason } from "@/lib/data/seasons";
import { getSeasonColors } from "@/lib/season-colors";
import NavClient from "@/components/NavClient";

/**
 * Wrapper server de la barra de navegación: resuelve la Season activa para
 * pasarle su forma y su acento al menú mobile (que los usa para el
 * tratamiento zine: stickers de fondo y color de acento). El resto de la
 * interacción vive en NavClient.
 */
export default async function Nav() {
  const season = await getActiveSeason();
  const accent = season ? getSeasonColors(season)[0] : "#111111";
  const forma = season?.forma ?? "square";
  return <NavClient accent={accent} forma={forma} />;
}
