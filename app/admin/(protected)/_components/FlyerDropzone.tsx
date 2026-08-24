"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { compressToWebp, FLYER_COMPRESSION } from "@/lib/image/compress";
import { attachFlyer, removeFlyer } from "../fechas/actions";
import type { AdminFecha } from "../data";

export default function FlyerDropzone({
  fecha,
  seasonSlug,
}: {
  fecha: AdminFecha;
  seasonSlug: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [removing, startRemoving] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const blob = await compressToWebp(file, FLYER_COMPRESSION);
      const path = `${seasonSlug}/${fecha.fecha}.webp`;
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("flyers")
        .upload(path, blob, { contentType: "image/webp", upsert: true });
      if (uploadError) throw uploadError;
      await attachFlyer(fecha.id, seasonSlug, path);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir el flyer.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="label-mono text-muted">Flyer</span>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        className={`flex items-center gap-4 border border-dashed p-3 transition-colors ${
          dragOver ? "border-accent-1 bg-paper" : "border-line"
        }`}
      >
        {fecha.flyerUrl ? (
          <div className="relative h-24 w-20 shrink-0 overflow-hidden border border-line bg-paper">
            <Image src={fecha.flyerUrl} alt="Flyer" fill sizes="80px" className="object-cover" />
          </div>
        ) : (
          <div className="flex h-24 w-20 shrink-0 items-center justify-center border border-line bg-paper text-center text-xs text-muted">
            Sin flyer
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="label-mono border border-line px-3 py-1.5 text-ink transition-colors hover:border-accent-1 disabled:opacity-60"
            >
              {uploading ? "Subiendo…" : fecha.flyerUrl ? "Reemplazar" : "Elegir archivo"}
            </button>
            {fecha.flyerUrl && fecha.flyerPath && (
              <button
                type="button"
                disabled={removing}
                onClick={() =>
                  startRemoving(async () => {
                    await removeFlyer(fecha.id, seasonSlug, fecha.flyerPath!);
                    router.refresh();
                  })
                }
                className="label-mono border border-line px-3 py-1.5 text-muted transition-colors hover:border-red-600 hover:text-red-600 disabled:opacity-60"
              >
                Quitar
              </button>
            )}
          </div>
          <p className="text-xs text-muted">o arrastrá una imagen acá</p>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
