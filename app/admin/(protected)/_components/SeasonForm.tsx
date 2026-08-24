"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Forma } from "@/lib/types";
import type { AdminSeason } from "../data";
import ColorFieldset from "./ColorFieldset";
import SeasonSliderManager from "./SeasonSliderManager";
import { upsertSeason, type SeasonFormState } from "../seasons/actions";

const FORMAS: { value: Forma; label: string }[] = [
  { value: "square", label: "Cuadrado" },
  { value: "triangle", label: "Triángulo" },
  { value: "circle", label: "Círculo" },
  { value: "hexagon", label: "Hexágono" },
  { value: "hexagon-organic", label: "Hexágono orgánico" },
  { value: "infinity", label: "Infinito" },
];

const DEFAULT_COLOR = "#1E38F5";

function resolveColors(colores?: string[]): string[] {
  const principal = colores?.[0] || DEFAULT_COLOR;
  return [0, 1, 2, 3, 4].map((i) => colores?.[i] || principal);
}

export default function SeasonForm({
  season,
  onSaved,
}: {
  season?: AdminSeason;
  onSaved?: (slug: string) => void;
}) {
  const [state, formAction, pending] = useActionState<SeasonFormState, FormData>(
    upsertSeason,
    undefined,
  );
  const [colores, setColores] = useState<string[]>(resolveColors(season?.colores));
  const [forma, setForma] = useState<Forma>(season?.forma ?? "square");
  const router = useRouter();

  useEffect(() => {
    if (state?.ok && state.slug) {
      onSaved?.(state.slug);
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={formAction}
      className="grid gap-6 border border-line bg-paper-2 p-5 sm:grid-cols-2"
    >
      {season && <input type="hidden" name="id" value={season.id} />}

      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="label-mono text-muted">Slug (URL /eventos/[slug])</span>
          <input
            name="slug"
            defaultValue={season?.slug}
            required
            pattern="[a-z0-9-]+"
            title="Sólo minúsculas, números y guiones"
            className="border border-line bg-paper px-3 py-2 outline-none focus:border-accent-1"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="label-mono text-muted">Número</span>
            <input
              name="numero"
              defaultValue={season?.numero}
              required
              placeholder="01"
              className="border border-line bg-paper px-3 py-2 outline-none focus:border-accent-1"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="label-mono text-muted">Nombre</span>
            <input
              name="nombre"
              defaultValue={season?.nombre}
              required
              className="border border-line bg-paper px-3 py-2 outline-none focus:border-accent-1"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="label-mono text-muted">Forma</span>
          <select
            name="forma"
            value={forma}
            onChange={(e) => setForma(e.target.value as Forma)}
            className="border border-line bg-paper px-3 py-2 outline-none focus:border-accent-1"
          >
            {FORMAS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="label-mono text-muted">Concepto (1 frase)</span>
          <textarea
            name="concepto"
            defaultValue={season?.concepto}
            rows={2}
            className="border border-line bg-paper px-3 py-2 outline-none focus:border-accent-1"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="label-mono text-muted">Fecha inicio</span>
            <input
              type="date"
              name="fechaInicio"
              defaultValue={season?.fechaInicio}
              required
              className="border border-line bg-paper px-3 py-2 outline-none focus:border-accent-1"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="label-mono text-muted">Fecha fin</span>
            <input
              type="date"
              name="fechaFin"
              defaultValue={season?.fechaFin}
              required
              className="border border-line bg-paper px-3 py-2 outline-none focus:border-accent-1"
            />
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <ColorFieldset colores={colores} onChange={setColores} />

        {season ? (
          <SeasonSliderManager
            sliderPhotos={season.sliderPhotos}
            seasonId={season.id}
            seasonSlug={season.slug}
          />
        ) : (
          <div className="flex flex-col gap-2">
            <span className="label-mono text-muted">Slider Experience</span>
            <p className="text-xs text-muted">
              Guardá la Season primero para poder subir fotos.
            </p>
          </div>
        )}

        <div className="mt-auto flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="label-mono bg-ink px-5 py-3 text-paper transition-colors hover:bg-accent-1 disabled:opacity-60"
          >
            {pending ? "Guardando…" : "Guardar Season"}
          </button>
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          {state?.ok && <p className="text-sm text-muted">Guardado ✓</p>}
        </div>
      </div>
    </form>
  );
}
