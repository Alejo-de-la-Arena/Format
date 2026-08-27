"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminFecha, AdminSeasonWithFechas } from "../data";
import { upsertFecha, type FechaFormState } from "../fechas/actions";
import FlyerDropzone from "./FlyerDropzone";
import LineupEditor from "./LineupEditor";
import GalleryManager from "./GalleryManager";

export default function FechaForm({
  season,
  fecha,
  onSaved,
}: {
  season: AdminSeasonWithFechas;
  fecha?: AdminFecha;
  onSaved?: (id: string) => void;
}) {
  const [state, formAction, pending] = useActionState<FechaFormState, FormData>(
    upsertFecha,
    undefined,
  );
  const [especial, setEspecial] = useState(fecha?.especial ?? false);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok && state.id) {
      onSaved?.(state.id);
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4 border border-line bg-paper-2 p-4">
      {fecha && <input type="hidden" name="id" value={fecha.id} />}
      <input type="hidden" name="seasonId" value={season.id} />
      <input type="hidden" name="seasonSlug" value={season.slug} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="flex flex-col gap-1.5">
          <span className="label-mono text-muted">Fecha</span>
          <input
            type="date"
            name="fecha"
            defaultValue={fecha?.fecha}
            required
            className="border border-line bg-paper px-2.5 py-2 outline-none focus:border-accent-1"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label-mono text-muted">Apertura</span>
          <input
            type="time"
            name="horaInicio"
            defaultValue={fecha?.horaInicio ?? ""}
            className="border border-line bg-paper px-2.5 py-2 outline-none focus:border-accent-1"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label-mono text-muted">Cierre</span>
          <input
            type="time"
            name="horaFin"
            defaultValue={fecha?.horaFin ?? ""}
            className="border border-line bg-paper px-2.5 py-2 outline-none focus:border-accent-1"
          />
        </label>
        <label className="flex items-end gap-2 pb-2.5">
          <input
            type="checkbox"
            name="especial"
            checked={especial}
            onChange={(e) => setEspecial(e.target.checked)}
            className="h-4 w-4"
          />
          <span className="label-mono text-muted">Experience</span>
        </label>
      </div>

      {especial && (
        <div className="flex flex-col gap-3 border border-accent-1/40 bg-paper p-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="barraLibre"
              defaultChecked={fecha?.barraLibre}
              className="h-4 w-4"
            />
            <span className="label-mono text-muted">Barra libre</span>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="label-mono text-muted">Trago de autor — nombre</span>
              <input
                name="tragoNombre"
                defaultValue={fecha?.tragoNombre ?? ""}
                className="border border-line bg-paper px-2.5 py-2 outline-none focus:border-accent-1"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="label-mono text-muted">Descripción</span>
              <input
                name="tragoDescripcion"
                defaultValue={fecha?.tragoDescripcion ?? ""}
                className="border border-line bg-paper px-2.5 py-2 outline-none focus:border-accent-1"
              />
            </label>
          </div>
        </div>
      )}

      {fecha ? (
        <>
          <FlyerDropzone fecha={fecha} seasonSlug={season.slug} />
          <LineupEditor lineup={fecha.lineup} fechaId={fecha.id} seasonSlug={season.slug} />
          <GalleryManager
            fotos={fecha.fotos}
            fechaId={fecha.id}
            fecha={fecha.fecha}
            seasonSlug={season.slug}
          />
        </>
      ) : (
        <p className="text-xs text-muted">
          Guardá la fecha primero para poder cargar flyer, lineup y galería.
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="label-mono bg-ink px-5 py-3 text-paper transition-colors hover:bg-accent-1 disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar fecha"}
        </button>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      </div>
    </form>
  );
}
