"use client";

import { useState } from "react";
import type { AdminSeasonWithFechas } from "../data";
import FechaForm from "./FechaForm";
import ConfirmButton from "./ConfirmButton";
import { deleteFecha } from "../fechas/actions";
import { fechaCorta } from "@/lib/dates";

export default function FechaList({ season }: { season: AdminSeasonWithFechas }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const fechas = [...season.fechas].sort((a, b) => a.fecha.localeCompare(b.fecha));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="label-mono text-muted">Fechas</h3>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="label-mono border border-line px-3 py-1.5 text-ink transition-colors hover:border-accent-1"
        >
          {creating ? "Cancelar" : "+ Nueva fecha"}
        </button>
      </div>

      {creating && (
        <FechaForm
          season={season}
          onSaved={(id) => {
            setCreating(false);
            setEditingId(id);
          }}
        />
      )}

      {fechas.length === 0 && !creating && (
        <p className="text-sm text-muted">Todavía no hay fechas en esta Season.</p>
      )}

      <ul className="flex flex-col divide-y divide-line border-t border-line">
        {fechas.map((f) => (
          <li key={f.id} className="py-3">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setEditingId(editingId === f.id ? null : f.id)}
                className="flex flex-1 items-center gap-3 text-left"
              >
                <span className="label-mono text-muted">{fechaCorta(f.fecha)}</span>
                {f.especial && (
                  <span className="label-mono border border-accent-1 px-2 py-0.5 text-accent-1">
                    Experience
                  </span>
                )}
                {f.flyerUrl && <span className="text-xs text-muted">Flyer ✓</span>}
                {f.lineup.length > 0 && (
                  <span className="text-xs text-muted">{f.lineup.length} slot(s)</span>
                )}
                {f.fotos.length > 0 && (
                  <span className="text-xs text-muted">{f.fotos.length} foto(s)</span>
                )}
              </button>
              <ConfirmButton label="Borrar" action={() => deleteFecha(f.id, season.slug)} />
            </div>
            {editingId === f.id && (
              <div className="mt-3">
                <FechaForm season={season} fecha={f} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
