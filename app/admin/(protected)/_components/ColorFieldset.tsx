"use client";

const ROLES = [
  "Principal — stickers, links, botones, bordes activos",
  "Secundario — hovers, estados activos, badges",
  "Gradientes / glow / fondos teñidos",
  "Detalle — líneas finas, dividers",
  "Highlight puntual",
];

/** 5 inputs de color (picker + hex) con roles fijos por posición — ver CLAUDE.md § Colores por Season. */
export default function ColorFieldset({
  colores,
  onChange,
}: {
  colores: string[];
  onChange: (colores: string[]) => void;
}) {
  function setAt(i: number, value: string) {
    const next = [...colores];
    next[i] = value;
    onChange(next);
  }

  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="label-mono mb-1 text-muted">Colores</legend>
      {ROLES.map((role, i) => (
        <div key={role} className="flex items-center gap-3">
          <input
            type="color"
            value={colores[i] ?? "#000000"}
            onChange={(e) => setAt(i, e.target.value)}
            className="h-9 w-9 shrink-0 cursor-pointer border border-line bg-transparent p-0"
          />
          <input
            type="text"
            name="colores"
            value={colores[i] ?? ""}
            onChange={(e) => setAt(i, e.target.value)}
            placeholder="#000000"
            className="w-28 border border-line bg-paper px-2 py-1.5 font-mono text-sm uppercase outline-none focus:border-accent-1"
          />
          <span className="text-xs text-muted">{role}</span>
        </div>
      ))}
    </fieldset>
  );
}
