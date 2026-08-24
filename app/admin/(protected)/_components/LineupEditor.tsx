"use client";

import { useState, useTransition } from "react";
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
import type { AdminLineupSlot } from "../data";
import { upsertLineupSlot, deleteLineupSlot, reorderLineupSlots } from "../lineup/actions";
import ConfirmButton from "./ConfirmButton";

interface DraftSlot extends AdminLineupSlot {
  isNew?: boolean;
}

function SlotRow({
  slot,
  seasonSlug,
  fechaId,
  onSaved,
  onDeleted,
}: {
  slot: DraftSlot;
  seasonSlug: string;
  fechaId: string;
  onSaved: (slot: DraftSlot) => void;
  onDeleted: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: slot.id,
  });
  const [horaInicio, setHoraInicio] = useState(slot.horaInicio ?? "");
  const [horaFin, setHoraFin] = useState(slot.horaFin ?? "");
  const [artistas, setArtistas] = useState<string[]>(slot.artistas);
  const [nuevoArtista, setNuevoArtista] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function addArtista() {
    const nombre = nuevoArtista.trim();
    if (!nombre) return;
    setArtistas((a) => [...a, nombre]);
    setNuevoArtista("");
  }

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        const { id } = await upsertLineupSlot(fechaId, seasonSlug, {
          id: slot.isNew ? undefined : slot.id,
          orden: slot.orden,
          horaInicio,
          horaFin,
          artistas,
        });
        onSaved({ ...slot, id, horaInicio, horaFin, artistas, isNew: false });
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo guardar el slot.");
      }
    });
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
          aria-label="Reordenar"
        >
          ⠿
        </button>
        <input
          type="time"
          value={horaInicio}
          onChange={(e) => setHoraInicio(e.target.value)}
          className="border border-line px-2 py-1 text-sm"
        />
        <span className="text-muted">—</span>
        <input
          type="time"
          value={horaFin}
          onChange={(e) => setHoraFin(e.target.value)}
          className="border border-line px-2 py-1 text-sm"
        />
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            disabled={pending || artistas.length === 0}
            onClick={save}
            className="label-mono border border-line px-2.5 py-1 text-xs transition-colors hover:border-accent-1 disabled:opacity-60"
          >
            {pending ? "Guardando…" : "Guardar slot"}
          </button>
          <ConfirmButton
            label="Borrar"
            action={async () => {
              if (!slot.isNew) await deleteLineupSlot(slot.id, seasonSlug);
              onDeleted(slot.id);
            }}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {artistas.map((a, i) => (
          <span
            key={`${a}-${i}`}
            className="flex items-center gap-1 border border-line bg-paper-2 px-2 py-1 text-xs"
          >
            {a}
            <button
              type="button"
              onClick={() => setArtistas((arr) => arr.filter((_, idx) => idx !== i))}
              className="text-muted hover:text-red-600"
              aria-label={`Quitar ${a}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={nuevoArtista}
          onChange={(e) => setNuevoArtista(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addArtista();
            }
          }}
          placeholder="Artista + Enter (2+ = b2b)"
          className="border border-line px-2 py-1 text-xs outline-none focus:border-accent-1"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </li>
  );
}

export default function LineupEditor({
  lineup,
  fechaId,
  seasonSlug,
}: {
  lineup: AdminLineupSlot[];
  fechaId: string;
  seasonSlug: string;
}) {
  const [slots, setSlots] = useState<DraftSlot[]>(lineup);
  const sensors = useSensors(useSensor(PointerSensor));

  function addSlot() {
    setSlots((s) => [
      ...s,
      {
        id: crypto.randomUUID(),
        // Máximo existente + 1, no la cantidad de slots en el estado: si
        // hubo borrados antes puede haber huecos, y "cantidad" pisaría un
        // orden ya usado en la base (choca con el unique(fecha_id, orden)
        // y el guardado del slot falla).
        orden: Math.max(-1, ...s.map((x) => x.orden)) + 1,
        horaInicio: null,
        horaFin: null,
        artistas: [],
        isNew: true,
      },
    ]);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = slots.findIndex((i) => i.id === active.id);
    const newIndex = slots.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(slots, oldIndex, newIndex).map((s, i) => ({ ...s, orden: i }));
    setSlots(reordered);

    const persisted = reordered.filter((s) => !s.isNew);
    if (persisted.length > 0) {
      reorderLineupSlots(
        persisted.map((s) => ({ id: s.id, orden: s.orden })),
        seasonSlug,
      );
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="label-mono text-muted">Lineup</span>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={slots.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-2">
            {slots.map((slot) => (
              <SlotRow
                key={slot.id}
                slot={slot}
                seasonSlug={seasonSlug}
                fechaId={fechaId}
                onSaved={(saved) => setSlots((s) => s.map((x) => (x.id === slot.id ? saved : x)))}
                onDeleted={(id) => setSlots((s) => s.filter((x) => x.id !== id))}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      {slots.length === 0 && <p className="text-xs text-muted">Sin slots todavía.</p>}
      <button
        type="button"
        onClick={addSlot}
        className="label-mono self-start border border-line px-3 py-1.5 text-ink transition-colors hover:border-accent-1"
      >
        + Agregar slot
      </button>
    </div>
  );
}
