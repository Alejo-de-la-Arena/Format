"use client";

import { useState, useTransition, type KeyboardEvent } from "react";
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
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { parseVideoUrl } from "@/lib/embed";
import type { AdminLabClip } from "../data";
import { upsertLabClip, deleteLabClip, reorderLabClips } from "../seasons/actions";
import ConfirmButton from "./ConfirmButton";

interface DraftClip extends AdminLabClip {
  isNew?: boolean;
}

function ClipRow({
  clip,
  seasonId,
  seasonSlug,
  onSaved,
  onDeleted,
}: {
  clip: DraftClip;
  seasonId: string;
  seasonSlug: string;
  onSaved: (clip: DraftClip) => void;
  onDeleted: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: clip.id,
  });
  const [titulo, setTitulo] = useState(clip.titulo);
  const [url, setUrl] = useState(clip.url);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Feedback antes de guardar: la misma función que usa el player y la
  // Server Action, así lo que se ve acá es lo que va a pasar al guardar.
  const embed = parseVideoUrl(url);
  const urlInvalida = url.trim().length > 0 && !embed;

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        const { id } = await upsertLabClip(seasonId, seasonSlug, {
          id: clip.isNew ? undefined : clip.id,
          titulo,
          url,
          orden: clip.orden,
        });
        onSaved({ ...clip, id, titulo, url, isNew: false });
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo guardar el clip.");
      }
    });
  }

  // Estos inputs viven dentro del <form> de SeasonForm: sin esto, Enter
  // submitea la Season entera en vez de guardar el clip.
  function onEnter(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (url.trim() && !urlInvalida) save();
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex flex-col gap-2 border border-line bg-paper p-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab text-muted"
          aria-label="Reordenar clip"
        >
          ⠿
        </button>
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          onKeyDown={onEnter}
          placeholder="Nombre del DJ"
          aria-label="Título o nombre del DJ"
          className="min-w-[140px] flex-1 border border-line px-2 py-1 text-sm outline-none focus:border-accent-1"
        />
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            disabled={pending || !url.trim() || urlInvalida}
            onClick={save}
            className="label-mono border border-line px-2.5 py-1 text-xs transition-colors hover:border-accent-1 disabled:opacity-60"
          >
            {pending ? "Guardando…" : "Guardar clip"}
          </button>
          <ConfirmButton
            label="Borrar"
            confirmLabel="¿Borrar el clip?"
            action={async () => {
              if (!clip.isNew) await deleteLabClip(clip.id, seasonSlug);
              onDeleted(clip.id);
            }}
          />
        </div>
      </div>

      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={onEnter}
        placeholder="https://youtube.com/watch?v=… o https://vimeo.com/…"
        aria-label="URL del video"
        className={`w-full border px-2 py-1 text-sm outline-none focus:border-accent-1 ${
          urlInvalida ? "border-red-600" : "border-line"
        }`}
      />

      {urlInvalida && (
        <p className="text-xs text-red-600">
          No es una URL de video de YouTube ni de Vimeo.
        </p>
      )}
      {embed && (
        <p className="label-mono text-muted">
          {embed.platform === "youtube" ? "YouTube" : "Vimeo"} · {embed.id}
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </li>
  );
}

/**
 * FORMAT Lab: clips de video de la Season, uno por DJ. Cantidad libre,
 * reordenables (mismo patrón de dnd-kit que LineupEditor y GalleryManager)
 * y con borrado individual confirmado.
 *
 * A diferencia de la galería, acá no hay nada en Storage: el video vive en
 * YouTube/Vimeo y la fila guarda sólo la URL. Borrar un clip es borrar la
 * fila, sin limpieza de archivos.
 */
export default function LabClipsManager({
  clips: initialClips,
  seasonId,
  seasonSlug,
}: {
  clips: AdminLabClip[];
  seasonId: string;
  seasonSlug: string;
}) {
  const [clips, setClips] = useState<DraftClip[]>(initialClips);
  const [ordenError, setOrdenError] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = clips.findIndex((c) => c.id === active.id);
    const newIndex = clips.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(clips, oldIndex, newIndex).map((c, i) => ({
      ...c,
      orden: i,
    }));
    setClips(reordered);
    setOrdenError(null);
    // Los clips todavía sin guardar no existen en la base: no se mandan.
    // Si falla (RLS, sesión vencida, red) hay que decirlo: si no, la lista
    // queda mostrando un orden que nunca se guardó y que vuelve atrás solo
    // en el próximo refresh.
    reorderLabClips(
      reordered.filter((c) => !c.isNew).map((c) => ({ id: c.id, orden: c.orden })),
      seasonSlug,
    ).catch(() =>
      setOrdenError("No se pudo guardar el orden. Recargá y probá de nuevo."),
    );
  }

  function addClip() {
    setClips((c) => [
      ...c,
      {
        id: crypto.randomUUID(),
        // max + 1, no `length`: borrar un clip del medio no renumera las
        // filas que quedan, así que con `length` el clip nuevo chocaría con
        // un `orden` ya usado (y `orden` no tiene unique).
        orden: Math.max(-1, ...c.map((x) => x.orden)) + 1,
        titulo: "",
        url: "",
        isNew: true,
      },
    ]);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="label-mono text-muted">FORMAT Lab ({clips.length})</span>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={clips.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-2">
            {clips.map((clip) => (
              <ClipRow
                key={clip.id}
                clip={clip}
                seasonId={seasonId}
                seasonSlug={seasonSlug}
                onSaved={(saved) =>
                  setClips((cs) => cs.map((c) => (c.id === clip.id ? saved : c)))
                }
                onDeleted={(id) => setClips((cs) => cs.filter((c) => c.id !== id))}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      {ordenError && <p className="text-xs text-red-600">{ordenError}</p>}

      {clips.length === 0 && (
        <p className="text-xs text-muted">
          Todavía no hay clips. Normalmente van 3, uno por DJ de la Season.
        </p>
      )}

      <div>
        <button
          type="button"
          onClick={addClip}
          className="label-mono border border-line px-3 py-1.5 text-ink transition-colors hover:border-accent-1"
        >
          + Agregar clip
        </button>
      </div>
    </div>
  );
}
