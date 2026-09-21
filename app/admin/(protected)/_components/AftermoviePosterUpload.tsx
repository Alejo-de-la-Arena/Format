"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { compressToWebp, FLYER_COMPRESSION } from "@/lib/image/compress";
import { getAftermoviePoster } from "@/lib/aftermovie-poster";
import { attachAftermoviePoster } from "../seasons/actions";
import type { AdminSeason } from "../data";

export default function AftermoviePosterUpload({ season, disabled }: { season?: AdminSeason; disabled: boolean }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedUrl, setSavedUrl] = useState<string>();
  const router = useRouter();
  const poster = savedUrl ?? (season ? getAftermoviePoster({ slug: season.slug, aftermoviePosterUrl: season.aftermoviePosterUrl ?? undefined }) : undefined);

  async function upload(file: File) {
    if (!season?.aftermoviePosterAvailable || uploading) return;
    setUploading(true);
    setError(null);
    const supabase = createClient();
    // Un objeto nuevo por reemplazo evita servir la imagen anterior desde caché.
    const path = `${season.id}/aftermovie-${crypto.randomUUID()}.webp`;
    try {
      if (!file.type.startsWith("image/")) throw new Error("Elegí una imagen.");
      const blob = await compressToWebp(file, FLYER_COMPRESSION);
      const { error: uploadError } = await supabase.storage.from("season-previews")
        .upload(path, blob, { contentType: "image/webp" });
      if (uploadError) throw uploadError;
      await attachAftermoviePoster(season.id, path);
      setSavedUrl(supabase.storage.from("season-previews").getPublicUrl(path).data.publicUrl);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la portada.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-2">
        <span className="label-mono text-muted">Portada del aftermovie</span>
        {poster && <Image src={poster} alt={`Portada del aftermovie de ${season?.nombre}`} width={90} height={160} className="h-40 w-[90px] object-cover" />}
        <input type="file" accept="image/*" disabled={disabled || uploading || !season?.aftermoviePosterAvailable}
          className="w-full min-w-0 text-sm file:mr-3 file:border file:border-line file:bg-paper file:px-3 file:py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-1 disabled:opacity-60"
          onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void upload(file); }} />
      </label>
      <p className="text-xs text-muted" aria-live="polite">
        {uploading ? "Guardando portada…" : !season ? "Guardá la Season primero para cargar su portada." : !season.aftermoviePosterAvailable ? "La carga de portadas todavía no está habilitada." : "Se guarda al elegir la imagen. Sólo cambia la portada del aftermovie en la home."}
      </p>
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    </div>
  );
}