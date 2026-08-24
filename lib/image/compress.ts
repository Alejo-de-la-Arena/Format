interface CompressOptions {
  /** Lado más largo en px. */
  maxDim: number;
  /** Calidad inicial (0–1). */
  quality: number;
  /** Si el resultado supera esto, se reintenta bajando calidad hasta 0.5. */
  maxBytes: number;
}

/** Flyer / foto de escena: nitidez, se ven grandes en el hero. */
export const FLYER_COMPRESSION: CompressOptions = {
  maxDim: 1600,
  quality: 0.82,
  maxBytes: 400_000,
};

/** Fotos de galería: son muchas por noche, prioriza peso total. */
export const GALERIA_COMPRESSION: CompressOptions = {
  maxDim: 1600,
  quality: 0.78,
  maxBytes: 300_000,
};

/** Comprime una imagen a WebP en el cliente (Canvas API, sin dependencias). */
export async function compressToWebp(
  file: File,
  { maxDim, quality, maxBytes }: CompressOptions,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo obtener el contexto 2D del canvas.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let q = quality;
  let blob = await canvas.convertToBlob({ type: "image/webp", quality: q });
  while (blob.size > maxBytes && q > 0.5) {
    q -= 0.1;
    blob = await canvas.convertToBlob({ type: "image/webp", quality: q });
  }
  return blob;
}
