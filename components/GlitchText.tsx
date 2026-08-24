import type { CSSProperties } from "react";

interface GlitchCSSProperties extends CSSProperties {
  "--after-duration": string;
  "--before-duration": string;
  "--after-shadow": string;
  "--before-shadow": string;
}

/**
 * GlitchText (React Bits), adaptado a la paleta del sitio: en vez de rojo/
 * cyan sobre fondo oscuro, las dos capas fantasma usan el accent de la
 * Season activa sobre gris papel, con un desplazamiento chico (2px) — lee
 * como falla de fotocopia, no como glitch cyberpunk. La tipografía
 * (tamaño, peso, mayúsculas) la define quien lo usa vía `className`, no
 * el componente.
 */
export default function GlitchText({
  children,
  speed = 1.8,
  enableShadows = true,
  enableOnHover = false,
  className = "",
  accent = "var(--color-accent-1)",
}: {
  children: string;
  speed?: number;
  enableShadows?: boolean;
  enableOnHover?: boolean;
  className?: string;
  accent?: string;
}) {
  const style: GlitchCSSProperties = {
    "--after-duration": `${speed * 3}s`,
    "--before-duration": `${speed * 2}s`,
    "--after-shadow": enableShadows ? `-2px 0 ${accent}` : "none",
    "--before-shadow": enableShadows
      ? `2px 0 color-mix(in srgb, ${accent} 55%, var(--color-ink) 45%)`
      : "none",
  };

  return (
    <span
      className={`glitch-text ${enableOnHover ? "glitch-text--hover" : ""} ${className}`}
      style={style}
      data-text={children}
    >
      {children}
    </span>
  );
}
