# FORMAT — Terraza JET

Sitio informativo del ciclo de música electrónica de la terraza de JET (Buenos Aires). No vende entradas: responde qué evento viene y cómo fueron los anteriores. Ver `CLAUDE.md` para los principios de diseño y voz, y `reference/prototype.html` como vara visual.

## Stack

Next.js (App Router) + TypeScript + Tailwind. Deploy en Vercel. Datos y auth: **Supabase** (proyecto FORMAT, org ADLA) — ver `supabase/migrations/`. Panel de carga en `/admin` (protegido, sin registro público).

## Modelo de datos

FORMAT Residence pasa todos los viernes. Cada nombre (Origin, Ascent, Bloom, Jungle, Eclipse, Infinity) es una **Season** de ~1 mes que agrupa varios viernes consecutivos bajo el mismo concepto, colores y forma — no es un evento de una sola noche. Una Season = un slug = una página `/eventos/[slug]`, que cubre todos sus viernes.

Los tipos viven en `lib/types.ts`. La fuente de verdad es Supabase (tablas `seasons`, `fechas`, `lineup_slots`, `fotos_galeria` — schema en `supabase/migrations/0001_init.sql`); `lib/data/seasons.ts` y `lib/data/fechas.ts` consultan esas tablas y mapean las filas a estos tipos, así los componentes de presentación no conocen el origen de los datos. Se cargan y editan desde `/admin`, sin redeploy (revalidación vía `revalidatePath` + `revalidate = 300` como red de seguridad).

### `Season`

| Campo | Tipo | Notas |
|---|---|---|
| `slug` | `string` | Para la URL: `/eventos/[slug]`. |
| `numero` | `string` | Número de edición, p. ej. `"01"`. |
| `nombre` | `string` | Nombre propio de la Season (no la forma geométrica). |
| `forma` | `"circle" \| "triangle" \| "square" \| "hexagon" \| "hexagon-organic" \| "infinity"` | Geometría de la Season, para el glifo. |
| `colores` | `string[]` (hex, hasta 5) | Roles fijos por posición — ver `CLAUDE.md` § Colores por Season. Nunca se muestra como paleta ni se nombra en pantalla. |
| `concepto` | `string` | 1 frase, tono evocativo. Es lo único descriptivo que ve el público. |
| `fechaInicio` / `fechaFin` | `string` | ISO `yyyy-mm-dd`, primer y último viernes de la Season. |

### `Fecha`

Un viernes individual dentro de una Season.

| Campo | Tipo | Notas |
|---|---|---|
| `seasonSlug` | `string` | FK a `Season.slug`. |
| `fecha` | `string` | ISO `yyyy-mm-dd`. **Una fecha única, no un rango.** El pasado/próximo de cada Fecha se calcula contra hoy (`lib/dates.ts#esPasado`), no se guarda. |
| `especial` | `boolean` | `true` en una fecha Experience (por convención, la apertura de la Season); el resto son Residence. |
| `horaInicio` / `horaFin` | `string?` | `"HH:MM"`. Si cruza medianoche sigue siendo la misma noche/`fecha`. |
| `lineup` | `LineupSlot[]?` | Slots ordenados, 1+ artistas cada uno (2+ = back-to-back). |
| `flyer` | `ImageSrc?` | Poster de esa fecha; cargarlo la hace aparecer en el slider de próximos. |
| `fotoEscena` | `ImageSrc?` | Foto de la puesta en escena de esa noche; card del archivo. |
| `galeria` | `string[]?` | Fotos de la noche (detalle de fechas pasadas), reordenables desde `/admin`. |
| `youtube` / `soundcloud` | `string?` | Embed del set, si existe. |
| `barraLibre` | `boolean?` | Sólo relevante si `especial = true`. |
| `tragoAutor` | `Cocktail?` | `{ nombre, descripcion }`. Cocktail de autor de esta fecha Experience — sólo relevante si `especial = true`; se muestra en el detalle de la fecha y persiste después de que pasó. |

### `LineupSlot`

`{ orden: number; horaInicio?: string; horaFin?: string; artistas: string[] }` — un slot por franja del lineup; 2+ artistas se renderiza como back-to-back (`"A b2b B"`).

### Infinity

Cierra la primera temporada combinando las 5 Seasons anteriores: en vez de un color fijo, su página (`/eventos/infinity`) rota sutilmente entre el principal de Origin, Ascent, Bloom, Jungle y Eclipse (`components/RotatingAccent.tsx`, `getAccentsExcept`), reusando el mismo mecanismo de colores que consumen `Glyph`/`EventImage` en el resto del sitio.

## Rutas

- `/` — home: próximos viernes, ediciones anteriores, Experience, Lab.
- `/fechas` — los viernes en orden cronológico (destacado + lista completa); la repetición del nombre de cada Season con fecha distinta comunica la cadencia semanal.
- `/eventos/[slug]?fecha=YYYY-MM-DD` — detalle de **un** viernes de la Season (el que se clickeó): flyer, lineup, fotos y set de esa noche, con los colores de su Season. Sin `?fecha=` (o con una fecha que no es de esa Season) muestra el próximo viernes de la Season, y si ya pasaron todos, el último. Los links entran siempre con `?fecha=` desde `ArchiveCard` y `/fechas`.
- `/experience` — página de FORMAT Experience (fechas Experience de cada Season).
- `/admin` — panel de carga (Supabase Auth email/password, sin registro público): Seasons y sus Fechas en acordeón, flyer/lineup/galería, colores con preview.
- `/special` — comentada, no desarrollar hasta nuevo aviso.
