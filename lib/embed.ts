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
  /** URL canónica que se guarda en Supabase, nunca el HTML pegado. */
  normalizedUrl: string;
}

/**
 * Formatos soportados, en el orden en que los tira cada plataforma al
 * compartir:
 *   youtube.com/watch?v=ID · youtu.be/ID · youtube.com/embed/ID · iframe
 *   youtube.com/shorts/ID  · youtube.com/live/ID
 *   vimeo.com/ID · vimeo.com/ID/HASH (no listado) · player.vimeo.com/video/ID
 *   vimeo.com/channels/xxx/ID · vimeo.com/groups/xxx/videos/ID
 * Los ids de YouTube son siempre 11 caracteres; los de Vimeo, numéricos.
 */
const YOUTUBE_RE =
  /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{11})/;

const VIMEO_RE =
  /vimeo\.com\/(?:video\/|channels\/[\w-]+\/|groups\/[\w-]+\/videos\/)?(\d+)(?:\/([\w]+))?/;

const IFRAME_RE = /^\s*<iframe\b([^>]*)>/i;
const IFRAME_SRC_RE = /\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i;

function parseIframe(input: string): { src: string } | null {
  const iframe = input.match(IFRAME_RE);
  if (!iframe) return null;

  const attributes = iframe[1];
  const src = attributes.match(IFRAME_SRC_RE);
  const value = src?.[1] ?? src?.[2] ?? src?.[3];
  if (!value) return null;

  return { src: value };
}

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
  "rel=0&modestbranding=1&iv_load_policy=3&playsinline=1&fs=0&color=white";

/** Vimeo: sin título, sin autor, sin avatar, sin badge, y con Do Not Track. */
const VIMEO_PARAMS = "title=0&byline=0&portrait=0&badge=0&dnt=1";

/**
 * Parsea una URL de YouTube o Vimeo. Devuelve null si no es ninguna de las
 * dos, o si es una URL de la plataforma que no apunta a un video (un canal,
 * una playlist sola). Es la misma función que usa la validación de /admin
 * al guardar y el render del player, así que lo que se guarda es siempre
 * embebible.
 */
export function parseVideoUrl(input: string): VideoEmbed | null {
  const raw = input.trim();
  if (!raw) return null;
  const iframe = parseIframe(raw);
  // Si parece HTML pero no es un iframe válido, no intentamos rescatar una
  // URL suelta: así jamás se guarda markup crudo por accidente.
  if (/^<iframe\b/i.test(raw) && !iframe) return null;
  const limpia = (iframe?.src ?? raw).trim();

  const yt = limpia.match(YOUTUBE_RE);
  if (yt) {
    return {
      platform: "youtube",
      id: yt[1],
      embedUrl: `https://www.youtube-nocookie.com/embed/${yt[1]}?${YOUTUBE_PARAMS}`,
      normalizedUrl: `https://www.youtube.com/watch?v=${yt[1]}`,
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
      normalizedUrl: `https://vimeo.com/${id}${hash ? `/${hash}` : ""}`,
    };
  }

  return null;
}

/** `true` si la URL es embebible. Atajo para la validación de formularios. */
export function isVideoUrl(url: string): boolean {
  return parseVideoUrl(url) !== null;
}

/** Miniatura original de YouTube. Vimeo no expone una URL equivalente sin
 * pedir oEmbed, así que esos clips conservan el poster de marca. */
export function getPlatformThumbnail(embed: VideoEmbed): string | undefined {
  return embed.platform === "youtube"
    ? `https://i.ytimg.com/vi/${embed.id}/maxresdefault.jpg`
    : undefined;
}

/** Portadas locales de los clips iniciales de FORMAT Lab. Se guardan junto al
 * sitio para que la grilla no dependa de que YouTube entregue una miniatura
 * remota ni de sus variantes de resoluciÃ³n. */
const LAB_COVERS: Record<string, string> = {
  owFITuKDXbw: "/images/lab-covers/fran-tettamanti.jpg",
  LGI8dnbRfNc: "/images/lab-covers/momo-luca-001.jpg",
  "57vqXP_GGNY": "/images/lab-covers/momo-luca-002.jpg",
  o8xLJ6Rwkgk: "/images/lab-covers/momo-luca-003.jpg",
};

/** Portada capturada para un clip conocido de FORMAT Lab. Los clips nuevos
 * siguen usando la miniatura de su plataforma hasta que se les sume asset. */
export function getLabClipCover(url: string): string | undefined {
  const embed = parseVideoUrl(url);
  return embed ? LAB_COVERS[embed.id] : undefined;
}

/**
 * La misma URL con autoplay: se usa recién cuando el usuario aprieta play
 * sobre el poster, nunca en la carga inicial (el iframe ni existe hasta
 * entonces — ver components/VideoPlayer.tsx).
 */
export function withAutoplay(embed: VideoEmbed, fullscreen = false): string {
  const embedUrl = fullscreen ? embed.embedUrl.replace("&fs=0", "&fs=1") : embed.embedUrl;
  return `${embedUrl}&autoplay=1`;
}

/** Preview real del aftermovie: autoplay permitido sólo en silencio y loop. */
export function withMutedPreview(embed: VideoEmbed): string {
  if (embed.platform === "youtube") {
    return `${embed.embedUrl}&autoplay=1&mute=1&loop=1&playlist=${embed.id}&controls=0&disablekb=1`;
  }
  return `${embed.embedUrl}&autoplay=1&muted=1&loop=1&background=1`;
}
