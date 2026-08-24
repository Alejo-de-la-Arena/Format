"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createClient } from "@/lib/supabase/client";
import { compressToWebp, GALERIA_COMPRESSION } from "@/lib/image/compress";
import { attachFoto, deleteFoto, reorderFotos } from "../galeria/actions";
import ConfirmButton from "./ConfirmButton";
import type { AdminFoto } from "../data";

function FotoTile({
  foto,
  seasonSlug,
  onDeleted,
}: {
  foto: AdminFoto;
  seasonSlug: string;
  onDeleted: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: foto.id,
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="relative aspect-square overflow-hidden border border-line bg-paper"
    >
      <Image src={foto.url} alt="" fill sizes="120px" className="object-cover" />
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1 cursor-grab bg-ink/70 px-1.5 py-0.5 text-xs text-paper"
        aria-label="Reordenar"
      >
        ⠿
      </button>
      <div className="absolute bottom-1 right-1">
        <ConfirmButton
          label="×"
          confirmLabel="¿Borrar?"
          action={async () => {
            await deleteFoto(foto.id, foto.storagePath, seasonSlug);
            onDeleted(foto.id);
          }}
          className="bg-ink/70 px-2 py-0.5 text-xs text-paper transition-colors hover:bg-red-600"
        />
      </div>
    </li>
  );
}

export default function GalleryManager({
  fotos: initialFotos,
  fechaId,
  fecha,
  seasonSlug,
}: {
  fotos: AdminFoto[];
  fechaId: string;
  fecha: string;
  seasonSlug: string;
}) {
  const [fotos, setFotos] = useState<AdminFoto[]>(initialFotos);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(useSensor(PointerSensor));

  async function handleFiles(files: FileList) {
    setUploading(true);
    setError(null);
    const supabase = createClient();
    let orden = fotos.length;

    const results = await Promise.allSettled(
      Array.from(files).map(async (file) => {
        const blob = await compressToWebp(file, GALERIA_COMPRESSION);
        const path = `${seasonSlug}/${fecha}/${crypto.randomUUID()}.webp`;
        const { error: uploadError } = await supabase.storage
          .from("galerias")
          .upload(path, blob, { contentType: "image/webp" });
        if (uploadError) throw uploadError;
        const ord = orden++;
        const { id } = await attachFoto(fechaId, seasonSlug, path, ord);
        const foto: AdminFoto = {
          id,
          orden: ord,
          storagePath: path,
          url: supabase.storage.from("galerias").getPublicUrl(path).data.publicUrl,
        };
        return foto;
      }),
    );

    const nuevas = results
      .filter((r): r is PromiseFulfilledResult<AdminFoto> => r.status === "fulfilled")
      .map((r) => r.value);
    if (nuevas.length > 0) setFotos((f) => [...f, ...nuevas]);
    if (results.some((r) => r.status === "rejected")) {
      setError("Algunas fotos no se pudieron subir.");
    }
    setUploading(false);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = fotos.findIndex((f) => f.id === active.id);
    const newIndex = fotos.findIndex((f) => f.id === over.id);
    const reordered = arrayMove(fotos, oldIndex, newIndex).map((f, i) => ({ ...f, orden: i }));
    setFotos(reordered);
    reorderFotos(
      reordered.map((f) => ({ id: f.id, orden: f.orden })),
      seasonSlug,
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="label-mono text-muted">Galería</span>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={fotos.map((f) => f.id)} strategy={rectSortingStrategy}>
          <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {fotos.map((foto) => (
              <FotoTile
                key={foto.id}
                foto={foto}
                seasonSlug={seasonSlug}
                onDeleted={(id) => setFotos((f) => f.filter((x) => x.id !== id))}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      {fotos.length === 0 && <p className="text-xs text-muted">Sin fotos todavía.</p>}
      <div>
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="label-mono border border-line px-3 py-1.5 text-ink transition-colors hover:border-accent-1 disabled:opacity-60"
        >
          {uploading ? "Subiendo…" : "+ Agregar fotos"}
        </button>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
