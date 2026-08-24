/** Extrae el video id de una URL de YouTube (watch, youtu.be o embed). */
function getYoutubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/
  );
  return match ? match[1] : null;
}

/** URL de embed de YouTube, o null si `url` no trae un video id embebible. */
export function getYoutubeEmbedUrl(url: string): string | null {
  const id = getYoutubeId(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

/** SoundCloud embebe cualquier URL de track/set vía su propio player endpoint. */
export function getSoundcloudEmbedUrl(url: string): string {
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff2d1f&auto_play=false&show_teaser=false`;
}
