/**
 * Modelo de datos — ver README.md § Modelo de datos. Fuente de verdad:
 * Supabase (proyecto FORMAT). Estos tipos son el shape que consume la capa
 * de presentación; lib/data/{seasons,fechas}.ts mapea las filas de Supabase
 * a este shape.
 */

import type { StaticImageData } from "next/image";
import type { IntroMotion } from "./season-intro";

/** URL (Supabase Storage) o asset importado localmente. */
export type ImageSrc = string | StaticImageData;

/** Geometría que ancla la Season. Sólo para dibujar el glifo. */
export type Forma =
  | "circle"
  | "triangle"
  | "square"
  | "hexagon"
  | "hexagon-organic"
  | "infinity"
  | "cross";

/** Un slot del lineup: 1 artista, o 2+ para back-to-back ("A b2b B"). */
export interface LineupSlot {
  orden: number;
  horaInicio?: string;
  horaFin?: string;
  artistas: string[];
}

export interface Cocktail {
  nombre: string;
  descripcion: string;
}

/**
 * Un clip de FORMAT Lab: video corto alojado en YouTube/Vimeo, típicamente
 * uno por DJ de la Season. Va contra la Season y no contra una Fecha — el
 * clip es del DJ dentro del concepto de la Season, no de un viernes puntual.
 * La cantidad es libre.
 */
export interface LabClip {
  /** Nombre del DJ, o título del clip. */
  titulo: string;
  /** URL de YouTube o Vimeo tal cual se cargó en /admin. */
  url: string;
  orden: number;
}

/**
 * Una Season mensual: agrupa varios viernes Residence consecutivos bajo el
 * mismo concepto, forma y paleta. El primer viernes suele ser la apertura
 * (Experience), marcada con `especial` en su Fecha.
 */
export interface Season {
  /** Para la URL: /eventos/[slug] */
  slug: string;
  /** Número de edición, p. ej. "01" */
  numero: string;
  nombre: string;
  forma: Forma;
  /**
   * Hasta 5 hex, en orden de rol (ver CLAUDE.md § Colores por Season):
   * 1 principal (stickers, links, botones, bordes activos), 2 secundario
   * (hovers, estados activos, badges), 3 gradientes/glows/fondos teñidos,
   * 4 detalle (líneas finas, dividers, subrayados), 5 highlight puntual.
   * Si carga menos de 5, los faltantes se completan con el principal — ver
   * `getSeasonColors`. Nunca se muestra como paleta ni se nombra en pantalla.
   */
  colores: string[];
  /** 1 frase, tono evocativo. Es lo único descriptivo que ve el público. */
  concepto: string;
  /** ISO yyyy-mm-dd, primer viernes de la Season. */
  fechaInicio: string;
  /** ISO yyyy-mm-dd, último viernes de la Season. */
  fechaFin: string;
  /**
   * URL de YouTube/Vimeo del aftermovie de la Season. El video no se aloja
   * en Supabase (sin transcoding ni streaming adaptativo): en /admin se pega
   * la URL y el embed se arma en el cliente — ver lib/embed.ts.
   */
  aftermovieUrl?: string;
  /** Clips de FORMAT Lab de esta Season, en orden. */
  labClips: LabClip[];
  /**
   * Contenido largo de identidad para /about, editable desde /admin. Todos
   * los campos son texto libre con saltos de línea; `""` cuando todavía no
   * se cargó. El trago no está acá: se lee de la fecha Experience de la
   * Season (ver `Fecha.tragoAutor`).
   */
  about: SeasonAbout;
  /** Optional until migration 0010 is applied; no duplicated identity data. */
  intro?: { text: string; motion: IntroMotion };
}

/** Bloques de texto de /about para una Season (ver migración 0009). */
export interface SeasonAbout {
  /** El relato de la Season — más largo que `concepto`. */
  relato: string;
  /** Qué comunica el color característico. */
  colorDescripcion: string;
  /** Qué representa la forma de la Season. */
  formaDescripcion: string;
}

/**
 * Un viernes individual dentro de una Season. `especial` marca la apertura
 * (tratamiento Experience); el resto son Residence.
 */
export interface Fecha {
  /** FK a Season.slug */
  seasonSlug: string;
  /** ISO yyyy-mm-dd, fecha única (no rango). */
  fecha: string;
  especial: boolean;
  /** "HH:MM", hora de apertura de puertas */
  horaInicio?: string;
  /** "HH:MM", hora de cierre */
  horaFin?: string;
  lineup?: LineupSlot[];
  /** Flyer / poster de esta fecha. */
  flyer?: ImageSrc;
  /** Foto de la puesta en escena (nuestra), fecha ya pasada. */
  fotoEscena?: ImageSrc;
  /** Fotos de la noche (detalle, fecha ya pasada). */
  galeria?: string[];
  /** Sólo relevante cuando especial = true. */
  barraLibre?: boolean;
  /** Cocktail de autor de esta fecha Experience. */
  tragoAutor?: Cocktail;
}
