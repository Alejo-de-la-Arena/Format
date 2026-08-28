"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Forma } from "@/lib/types";
import type { AdminSeason } from "../data";
import ColorFieldset from "./ColorFieldset";
import LabClipsManager from "./LabClipsManager";
import { parseVideoUrl } from "@/lib/embed";
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
  const [aftermovie, setAftermovie] = useState(season?.aftermovieUrl ?? "");
  const router = useRouter();

  useEffect(() => {
    if (state?.ok && state.slug) {
      onSaved?.(state.slug);
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const aftermovieEmbed = parseVideoUrl(aftermovie);
  const aftermovieInvalido = aftermovie.trim().length > 0 && !aftermovieEmbed;

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

        {/* AFTERMOVIE — sólo la URL. El video vive en YouTube/Vimeo: Supabase
            Storage no hace transcoding ni streaming adaptativo. */}
        <label className="flex flex-col gap-1.5">
          <span className="label-mono text-muted">Aftermovie (YouTube o Vimeo)</span>
          <input
            name="aftermovieUrl"
            value={aftermovie}
            onChange={(e) => setAftermovie(e.target.value)}
            placeholder="https://youtube.com/watch?v=… o https://vimeo.com/…"
            className={`border bg-paper px-3 py-2 outline-none focus:border-accent-1 ${
              aftermovieInvalido ? "border-red-600" : "border-line"
            }`}
          />
          {aftermovieInvalido ? (
            <span className="text-xs text-red-600">
              No es una URL de video de YouTube ni de Vimeo.
            </span>
          ) : aftermovieEmbed ? (
            <span className="label-mono text-muted">
              {aftermovieEmbed.platform === "youtube" ? "YouTube" : "Vimeo"} ·{" "}
              {aftermovieEmbed.id}
            </span>
          ) : (
            <span className="text-xs text-muted">
              Dejalo vacío si todavía no hay aftermovie.
            </span>
          )}
        </label>

        {season ? (
          <LabClipsManager
            clips={season.labClips}
            seasonId={season.id}
            seasonSlug={season.slug}
          />
        ) : (
          <div className="flex flex-col gap-2">
            <span className="label-mono text-muted">FORMAT Lab</span>
            <p className="text-xs text-muted">
              Guardá la Season primero para poder cargar clips.
            </p>
          </div>
        )}

      </div>

      {/* ABOUT FORMAT — texto largo de identidad para /about. Sólo con la
          Season ya creada: necesita fila para guardar contra ella. */}
      <div className="flex flex-col gap-4 sm:col-span-2">
        <span className="label-mono text-muted">About FORMAT (página /about)</span>
        {season ? (
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-1.5">
              <span className="label-mono text-muted">Relato de la Season</span>
              <textarea
                name="aboutRelato"
                defaultValue={season.aboutRelato}
                rows={7}
                placeholder="El relato largo de la Season. Se permiten saltos de línea."
                className="resize-y border border-line bg-paper px-3 py-2 leading-relaxed outline-none focus:border-accent-1"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="label-mono text-muted">Color — qué comunica</span>
              <textarea
                name="colorDescripcion"
                defaultValue={season.colorDescripcion}
                rows={7}
                placeholder="El color característico y qué transmite."
                className="resize-y border border-line bg-paper px-3 py-2 leading-relaxed outline-none focus:border-accent-1"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="label-mono text-muted">Forma — qué representa</span>
              <textarea
                name="formaDescripcion"
                defaultValue={season.formaDescripcion}
                rows={7}
                placeholder="La forma de la Season y qué significa."
                className="resize-y border border-line bg-paper px-3 py-2 leading-relaxed outline-none focus:border-accent-1"
              />
            </label>
          </div>
        ) : (
          <p className="text-xs text-muted">
            Guardá la Season primero para cargar el contenido de /about.
          </p>
        )}
        <p className="text-xs text-muted">
          El trago de autor no se carga acá: va en la fecha Experience de la
          Season y /about lo lee de ahí.
        </p>
      </div>

      <fieldset disabled={!season?.introAvailable} className="space-y-4 border-t border-line pt-6 sm:col-span-2 disabled:opacity-60">
        <legend className="label-mono px-2">Bienvenida a la Season</legend>
        <p className="text-sm text-muted">
          Una vez por navegador, desde el primer día de esta Season. La forma y los colores se toman de arriba.
        </p>
        {!season?.introAvailable && <p className="text-sm">Aplicá 0010_season_intro.sql y recargá. Si es nueva, guardá primero la Season.</p>}
        <label className="flex flex-col gap-1.5">
          <span className="label-mono text-muted">Frase de bienvenida (opcional)</span>
          <textarea name="introText" defaultValue={season?.introText ?? ""} rows={3} maxLength={160}
            placeholder={"WELCOME TO\nTHE ORIGIN."}
            className="resize-y border border-line bg-paper px-3 py-2 leading-relaxed outline-none focus:border-accent-1" />
          <span className="text-xs text-muted">Hasta 160 caracteres y 3 líneas. Se respetan los saltos de línea. Vacío: bienvenida con el nombre de la Season.</span>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="label-mono text-muted">Movimiento</span>
          <select name="introMotion" defaultValue={season?.introMotion ?? "signal"}
            className="border border-line bg-paper px-3 py-3 outline-none focus:border-accent-1">
            <option value="signal">Señal — la forma se ensambla</option>
            <option value="ascend">Ascenso — la forma sube</option>
            <option value="expand">Expansión — la forma se abre</option>
          </select>
        </label>
      </fieldset>

      <div className="flex items-center gap-3 sm:col-span-2">
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
    </form>
  );
}
