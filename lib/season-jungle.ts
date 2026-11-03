import type { Fecha, Season } from "@/lib/types";

/** Constantes locales de JUNGLE para el preview de dev (mismos datos que supabase/seeds/0021_jungle.sql). */
export const JUNGLE: Season = {
  slug: "jungle",
  numero: "004",
  nombre: "JUNGLE",
  forma: "double-diamond",
  colores: ["#0F8A34", "#0A3D1F", "#3DFF5C", "#C6F7A8", "#FFFFFF"],
  concepto: "Let it grow.",
  fechaInicio: "2026-11-06",
  fechaFin: "2026-11-27",
  about: {
    relato: `La expansión. Lo vivo empieza a ocuparlo todo.

JUNGLE es el momento en que FORMAT se desborda. Lo que empezó como estructura, subió y aprendió a latir junto, ahora crece por su cuenta: se enreda, se extiende, toma la terraza.

No es una selva de postal. Es naturaleza intervenida por la noche, el sonido y la luz: hojas, sombras y neón sobre el río.`,
    colorDescripcion: `Verde.

Profundo, húmedo, vivo.

Es el color de lo que crece sin pedir permiso. Abajo, la sombra espesa de las hojas; arriba, un destello ácido, como la luz que se filtra entre ellas.

No decora la terraza: la cubre.`,
    formaDescripcion: `Rombo con doble línea.

El cuadrado de Origin, girado sobre su punta.

La estructura del inicio, inclinada y tomada por lo vivo. La doble línea de Pulse sigue ahí: la conexión no se pierde, ahora contiene una selva.`,
  },
  intro: { text: "LET IT GROW.", motion: "grow" },
};

export const JUNGLE_FECHAS: Fecha[] = [6, 13, 20, 27].map((day) => ({
  seasonSlug: JUNGLE.slug,
  fecha: `2026-11-${String(day).padStart(2, "0")}`,
  especial: day === 6,
}));
