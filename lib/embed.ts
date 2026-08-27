/**
 * Video por URL: FORMAT no aloja video propio (Supabase Storage no hace
 * transcoding ni streaming adaptativo). El aftermovie de la Season y los
 * clips de FORMAT Lab se cargan en /admin como una URL de YouTube o Vimeo;
 * acá la parseamos y armamos el embed.
 */

export type VideoPlatform = "youtube" | "vimeo";

export interface VideoEmbed {
  platform: VideoPlatform;
  /** Id del video en su plataforma. */
  id: string;
  /** Hash de video oculto de Vimeo (el `h=` de los links no listados). */
  hash?: string;
  /** URL lista para el src del iframe, sin autoplay. */
  embedUrl: string;
}

/**
 * Formatos soportados, en el orden en que los tira cada plataforma al
 * compartir:
 *   youtube.com/watch?v=ID · youtu.be/ID · youtube.com/embed/ID
 *   youtube.com/shorts/ID  · youtube.com/live/ID
 *   vimeo.com/ID · vimeo.com/ID/HASH (no listado) · player.vimeo.com/video/ID
 *   vimeo.com/channels/xxx/ID · vimeo.com/groups/xxx/videos/ID
 * Los ids de YouTube son siempre 11 caracteres; los de Vimeo, numéricos.
 */
const YOUTUBE_RE =
  /(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{11})/;

const VIMEO_RE =
  /vimeo\.com\/(?:video\/|channels\/[\w-]+\/|groups\/[\w-]+\/videos\/)?(\d+)(?:\/([\w]+))?/;

/**
 * Hash de video oculto en la query (`?h=…`). Vimeo lo pone en el path
 * (`vimeo.com/ID/HASH`) al compartir, pero el botón "Embed" y algunos links
 * de share lo mandan como parámetro: `player.vimeo.com/video/ID?h=…`.
 * Sin el hash el player contesta "Because of its privacy settings, this
 * video cannot be played", así que hay que leer las dos formas.
 *
 * A mano y no con `new URL().searchParams` porque la URL puede venir pegada
 * sin esquema ("vimeo.com/123?h=abc"), y ahí `new URL` tira.
 */
function vimeoHashDeQuery(url: string): string | undefined {
  return url.match(/[?&]h=([\w]+)/)?.[1];
}

/**
 * Parámetros del player. La idea es la misma en las dos plataformas: sacar
 * todo el chrome que se pueda y, sobre todo, no cerrar con una grilla de
 * videos sugeridos de otros canales.
 *
 * `rel=0` en YouTube ya no elimina los sugeridos (cambió en 2018), pero sí
 * los limita al mismo canal — es lo máximo que da la plataforma. El resto:
 * sin anotaciones (`iv_load_policy=3`), sin marca de agua chica
 * (`modestbranding=1`) y sin fullscreen forzado en iOS (`playsinline=1`).
 */
const YOUTUBE_PARAMS =
  "rel=0&modestbranding=1&iv_load_policy=3&playsinline=1&color=white";

/** Vimeo: sin título, sin autor, sin avatar, sin badge, y con Do Not Track. */
const VIMEO_PARAMS = "title=0&byline=0&portrait=0&badge=0&dnt=1";

/**
 * Parsea una URL de YouTube o Vimeo. Devuelve null si no es ninguna de las
 * dos, o si es una URL de la plataforma que no apunta a un video (un canal,
 * una playlist sola). Es la misma función que usa la validación de /admin
 * al guardar y el render del player, así que lo que se guarda es siempre
 * embebible.
 */
export function parseVideoUrl(url: string): VideoEmbed | null {
  const limpia = url.trim();
  if (!limpia) return null;

  const yt = limpia.match(YOUTUBE_RE);
  if (yt) {
    return {
      platform: "youtube",
      id: yt[1],
      embedUrl: `https://www.youtube-nocookie.com/embed/${yt[1]}?${YOUTUBE_PARAMS}`,
    };
  }

  const vimeo = limpia.match(VIMEO_RE);
  if (vimeo) {
    const [, id, hashDePath] = vimeo;
    const hash = hashDePath ?? vimeoHashDeQuery(limpia);
    const params = hash ? `h=${hash}&${VIMEO_PARAMS}` : VIMEO_PARAMS;
    return {
      platform: "vimeo",
      id,
      hash,
      embedUrl: `https://player.vimeo.com/video/${id}?${params}`,
    };
  }

  return null;
}

/** `true` si la URL es embebible. Atajo para la validación de formularios. */
export function isVideoUrl(url: string): boolean {
  return parseVideoUrl(url) !== null;
}

/**
 * La misma URL con autoplay: se usa recién cuando el usuario aprieta play
 * sobre el poster, nunca en la carga inicial (el iframe ni existe hasta
 * entonces — ver components/VideoPlayer.tsx).
 */
export function withAutoplay(embed: VideoEmbed): string {
  return `${embed.embedUrl}&autoplay=1`;
}
