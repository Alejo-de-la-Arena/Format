import type { ReactNode } from "react";

/**
 * Marco de "pliego de imprenta en preparación" para el hero de
 * /eventos/[slug]. Todo vive en los MÁRGENES (esquinas y bordes): nunca se
 * superpone al título ni al flyer. No comparte nada con el fondo del hero
 * de la home (shader de puntos) — acá es un marco de imprenta, no un fondo.
 *
 * - Marcas de registro (cruz en círculo) en las 4 esquinas. Ciclo lento de
 *   desalineación por CSS; estáticas con prefers-reduced-motion.
 * - Marcas de corte en L en los puntos medios de los bordes (las laterales
 *   sólo en desktop: en mobile el flyer va full-bleed).
 * - Barra de control de color: los 5 colores de la Season en swatches
 *   consecutivos, como la tira de calibración de tinta de un pliego real.
 * - Numeración de pliego: nº de Season · fecha, muy bajo contraste.
 */

const INK = "#111111";

function RegistrationMark({ className }: { className: string }) {
  return (
    <svg
      className={`block ${className}`}
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke={INK}
      strokeWidth="1"
      aria-hidden
    >
      <circle cx="12" cy="12" r="7" />
      <line x1="12" y1="1" x2="12" y2="23" />
      <line x1="1" y1="12" x2="23" y2="12" />
    </svg>
  );
}

function CropMark({ className, d }: { className: string; d: string }) {
  return (
    <svg
      className={`block ${className}`}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke={INK}
      strokeWidth="1"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}

export default function PrintSheetFrame({
  colors,
  pliego,
  children,
}: {
  colors: [string, string, string, string, string];
  pliego: string;
  children: ReactNode;
}) {
  return (
    <div className="relative isolate pb-10 pt-9">
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        {/* Marcas de registro — 4 esquinas, apenas fuera de la caja. */}
        <RegistrationMark className="print-reg absolute -left-3 -top-3 opacity-30" />
        <RegistrationMark className="print-reg-alt absolute -right-3 -top-3 opacity-30" />
        <RegistrationMark className="print-reg-alt absolute -bottom-3 -left-3 opacity-30" />
        <RegistrationMark className="print-reg absolute -bottom-3 -right-3 opacity-30" />

        {/* Marcas de corte — puntos medios de los bordes. */}
        <CropMark
          className="absolute left-1/2 top-0 -translate-x-1/2 opacity-25"
          d="M7 0 V9 M2.5 4.5 H11.5"
        />
        <CropMark
          className="absolute -left-2 top-1/2 hidden -translate-y-1/2 opacity-25 lg:block"
          d="M0 7 H9 M4.5 2.5 V11.5"
        />
        <CropMark
          className="absolute -right-2 top-1/2 hidden -translate-y-1/2 opacity-25 lg:block"
          d="M14 7 H5 M9.5 2.5 V11.5"
        />

        {/* Barra de control de color — tira de calibración, estática. */}
        <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 border border-ink/40">
          {colors.map((c, i) => (
            <span
              key={i}
              className="block h-3 w-3"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Numeración de pliego — estática, bajo contraste. */}
        {pliego && (
          <span className="absolute right-4 top-0 font-mono text-[10px] tracking-wider text-ink/35">
            {pliego}
          </span>
        )}
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
