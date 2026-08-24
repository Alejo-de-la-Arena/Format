"use client";

import { useState } from "react";
import type { AdminSeasonWithFechas } from "../data";
import SeasonForm from "./SeasonForm";
import FechaList from "./FechaList";
import ConfirmButton from "./ConfirmButton";
import { deleteSeason } from "../seasons/actions";

export default function SeasonAccordion({ seasons }: { seasons: AdminSeasonWithFechas[] }) {
  const [expanded, setExpanded] = useState<string | null>(seasons[0]?.slug ?? null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">Seasons</h1>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="label-mono border border-line px-4 py-2 text-ink transition-colors hover:border-accent-1"
        >
          {creating ? "Cancelar" : "+ Nueva Season"}
        </button>
      </div>

      {creating && (
        <SeasonForm
          onSaved={(slug) => {
            setCreating(false);
            setExpanded(slug);
          }}
        />
      )}

      {seasons.length === 0 && !creating && (
        <p className="text-sm text-muted">Todavía no hay Seasons cargadas.</p>
      )}

      <ul className="flex flex-col divide-y divide-line border-t border-line">
        {seasons.map((season) => {
          const isOpen = expanded === season.slug;
          return (
            <li key={season.id} className="py-4">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : season.slug)}
                  className="flex flex-1 items-center gap-3 text-left"
                >
                  <span
                    aria-hidden
                    className={`text-muted transition-transform duration-200 ${
                      isOpen ? "rotate-45 text-accent-1" : ""
                    }`}
                  >
                    +
                  </span>
                  <span className="font-bold tracking-tight">
                    FORMAT {season.numero} — {season.nombre}
                  </span>
                  <span className="text-xs text-muted">
                    {season.fechas.length} fecha{season.fechas.length === 1 ? "" : "s"}
                  </span>
                </button>
                <ConfirmButton
                  label="Borrar Season"
                  confirmLabel="Se borran también sus fechas."
                  action={() => deleteSeason(season.id, season.slug)}
                />
              </div>
              {isOpen && (
                <div className="mt-4 flex flex-col gap-6">
                  <SeasonForm season={season} />
                  <FechaList season={season} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
