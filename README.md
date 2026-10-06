# FORMAT — Terraza JET

Sitio informativo del ciclo de música electrónica de la terraza de JET (Buenos Aires). No vende entradas: responde qué evento viene y cómo fueron los anteriores. Ver `CLAUDE.md` para los principios de diseño y voz, y `reference/prototype.html` como vara visual.

## Stack

Next.js (App Router) + TypeScript + Tailwind. Deploy en Vercel. Datos y auth: **Supabase** (proyecto FORMAT, org ADLA) — ver `supabase/migrations/`. Panel de carga en `/admin` (protegido, sin registro público).

## Modelo de datos

FORMAT Residence pasa todos los viernes. Cada nombre (Origin, Ascent, Bloom, Jungle, Eclipse, Infinity) es una **Season** de ~1 mes que agrupa varios viernes consecutivos bajo el mismo concepto, colores y forma — no es un evento de una sola noche. Una Season = un slug = una página `/eventos/[slug]`, que cubre todos sus viernes.

Los tipos viven en `lib/types.ts`. La fuente de verdad es Supabase (tablas `seasons`, `fechas`, `lineup_slots`, `fotos_galeria`, `season_lab_clips` — schema en `supabase/migrations/0001_init.sql` y siguientes); `lib/data/seasons.ts` y `lib/data/fechas.ts` consultan esas tablas y mapean las filas a estos tipos, así los componentes de presentación no conocen el origen de los datos. Se cargan y editan desde `/admin`, sin redeploy (revalidación vía `revalidatePath` + `revalidate = 300` como red de seguridad).

### `Season`

| Campo | Tipo | Notas |
|---|---|---|
| `slug` | `string` | Para la URL: `/eventos/[slug]`. |
| `numero` | `string` | Número de edición, p. ej. `"01"`. |
| `nombre` | `string` | Nombre propio de la Season (no la forma geométrica). |
| `forma` | `"circle" \| "double-circle" \| "triangle" \| "square" \| "hexagon" \| "hexagon-organic" \| "infinity" \| "cross"` | Geometría de la Season, para el glifo. Las formas desconocidas usan un cuadrado seguro. |
| `colores` | `string[]` (hex, hasta 5) | Roles fijos por posición — ver `CLAUDE.md` § Colores por Season. Nunca se muestra como paleta ni se nombra en pantalla. |
| `concepto` | `string` | 1 frase, tono evocativo. Es lo único descriptivo que ve el público. |
| `fechaInicio` / `fechaFin` | `string` | ISO `yyyy-mm-dd`, primer y último viernes de la Season. |
| `aftermovieUrl` | `string?` | URL de YouTube/Vimeo del aftermovie de la Season. Ver § Video. |

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
| `labClips` | `LabClip[]?` | Clips de FORMAT Lab de la fecha Experience, en orden. Ver § Video. |
| `barraLibre` | `boolean?` | Sólo relevante si `especial = true`. |
| `tragoAutor` | `Cocktail?` | `{ nombre, descripcion }`. Cocktail de autor de esta fecha Experience — sólo relevante si `especial = true`; se muestra en el detalle de la fecha y persiste después de que pasó. |

### `LineupSlot`

`{ orden: number; horaInicio?: string; horaFin?: string; artistas: string[] }` — un slot por franja del lineup; 2+ artistas se renderiza como back-to-back (`"A b2b B"`).

### `LabClip`

`{ titulo: string; url: string; orden: number }` — un clip de FORMAT Lab de una fecha Experience. `titulo` es el nombre del DJ.

## 003 PULSE · octubre 2026

Identidad local en `lib/season-pulse.ts`: doble anillo, paleta roja y viernes 9, 16, 23 y 30 de octubre (Opening el 9). Para previsualizar sin escribir a Supabase, iniciar `npm run dev` o `npm run build` y `npm run start` con `NEXT_PUBLIC_SEASON_OVERRIDE=pulse` (o agregarla a `.env.local`). El override fuerza tema, hero e intro y agrega las fechas en desarrollo y builds locales de producción; se ignora únicamente cuando `VERCEL_ENV=production`, incluso si la variable está seteada. La QA de performance usa build + start. Las demás Seasons y sus páginas conservan su identidad.

SQL pendientes, sin ejecución automática: aplicar manualmente `supabase/migrations/0018_double_circle.sql` para admitir la forma; **después del deploy**, ejecutar `supabase/seeds/0019_pulse.sql` para cargar la Season y las cuatro fechas. El sitio en producción toma la activa del calendario de Supabase. El seed conserva el contenido existente y no modifica Ascent.

El hero de Pulse conserva los ocho tratamientos originales, las fases de 2,8 s, su transición y el mismo flow-field. Sólo cambia el SDF por dos anillos concéntricos (interno = externo × 0,92, mismo grosor). En los modos 1, 3, 4, 5 y 7, las rotaciones se aplican al marco de muestreo del ruido para que se vean en un círculo. No hay latido, ondas ni órbita. Con movimiento reducido queda un frame estático. Verificación de todos los modos: `node tests/pulse-hero-modes.mjs`; vistas del override: `node tests/pulse-visual.mjs` (admiten `FORMAT_PLAYWRIGHT`, `FORMAT_CHROME` y `FORMAT_PREVIEW_URL`).

La entrada de Pulse está en `components/home/PulseIntro.tsx`, con sus tiempos en segundos al principio del archivo: una timeline de Motion de 3 s dibuja ambos anillos en sentidos opuestos, parpadea en escalones, da dos golpes y revela la página con un iris. Los destellos usan patrones SVG de puntos y máscaras radiales, sin WebGL ni blur. Las cintas dicen «WELCOME TO PULSE» y «FEEL THE CONNECTION». Click o cualquier tecla salta al iris; con movimiento reducido hay anillos estáticos, cintas con fade y salida a 1 s. Conserva la persistencia de sesión y la limpieza de foco/scroll. El shader del hero inicializa por detrás de la entrada. Las otras Seasons mantienen su intro anterior.

QA de entrada: `node tests/pulse-intro-visual.mjs`, con capturas de 0,3 / 1,1 / 1,8 / 2,7 s y movimiento reducido en 1440, 390 y 360 px, guardadas en `artifacts/pulse/intro/`. Incluye persistencia, salto por click/teclado, geometría concéntrica y tiempos con el driver nativo de Motion.

## Bienvenida por Season

La intro de las Seasons anteriores dura 2,8 segundos y muestra únicamente la Season activa: forma ensamblada en 400 ms, frase y bienvenida como un único bloque desde los 320 ms, salida de 350 ms desde los 2,45 s. Pulse usa la entrada descrita arriba.

- `seasons.intro_text`: frase opcional (hasta 160 caracteres y 3 líneas), seguida siempre de «WELCOME TO {nombre}». Sin frase se muestra sólo la bienvenida. Todo el contenido viene de la Season, sin copy por nombre hardcodeado.
- Tema, hero e intro comparten selección: Season en curso, próxima durante un intervalo, última si todas terminaron. La fecha se calcula en Buenos Aires. La intro sólo recibe esa identidad.
- Misma persistencia: `format:visit-intro:v2:<slug>:<fechaInicio>` en sessionStorage, con memoria como fallback. No se repite al navegar/recargar en esa sesión. Nueva sesión independiente: nueva intro. En las Seasons anteriores Escape cierra y movimiento reducido entra directo; Pulse usa salto al iris y entrada reducida de 1 s. No aparece en admin.
- «Qué es FORMAT» muestra la identidad activa y mantiene anónimo el adelanto siguiente («?»); no serializa el catálogo completo ni las identidades posteriores.
- Ascent: `triangle`, vértice arriba, paleta `#7B3FE4`, `#2E1065`, `#A06BFF`, `#D9C7FF`, `#FFFFFF`. El triángulo ya está permitido por el CHECK de `0001_init.sql` y por el selector del admin.
- Hero: ocho variantes de la forma activa salvo Pulse, que usa su doble anillo. Un plano WebGL; DPR limitado a 1 en mobile y 1,5 en desktop; pausado fuera del viewport, con pestaña oculta o intro abierta. Las repeticiones no reflejan/invierten el triángulo.
- Acentos Tailwind resueltos con `@theme inline`; CSS consume `--accent-1..5` en el elemento. El detalle de cada Season, incluido su header y menú, conserva su identidad; calendario y archivo usan la identidad de cada fecha.
- Pruebas: `node --test tests/*.test.mjs`, `npx tsc --noEmit`, `npm run build`. Preview aislada: `node tests/ascent-preview.mjs`; capturas con Playwright instalado: `node tests/ascent-visual.mjs` (admite `FORMAT_PLAYWRIGHT` y `FORMAT_CHROME`). Las fixtures no se conectan a Supabase y no cambian datos.

## Video

FORMAT **no aloja video propio**: Supabase Storage no hace transcoding ni streaming adaptativo. El aftermovie y los clips de Lab viven en YouTube o Vimeo; en `/admin` se acepta una URL o el iframe de “Insertar”, pero sólo se guarda una URL normalizada.

- **Aftermovie** — `seasons.aftermovie_url`, uno por Season. Va contra la Season y no contra una Fecha porque una Season son varios viernes y el aftermovie los resume a todos; ponerlo en `fechas` obligaría a elegir arbitrariamente qué viernes lo "posee". Se muestra en la banda FORMAT Experience de la home.
- **FORMAT Lab** — tabla `season_lab_clips` (`fecha_id`, `titulo`, `video_url`, `orden`), cantidad libre, reordenable con dnd-kit y disponible sólo para fechas Experience. Todos los clips usan el marco 16:9 nativo del player de YouTube; las medidas del iframe compartido no describen el video fuente. En mobile el marco sale del margen de lectura y llega a los bordes de pantalla: con el 16:9 y la columna única fijos, el ancho es lo único que da altura (390 px de viewport → 219 px de alto, contra 186 px cuando respetaba el margen). En desktop la columna ya es ancha y no cambia. Al ser sólo URLs, borrar un clip es borrar la fila — no hay objetos en Storage que limpiar.

`lib/embed.ts` parsea las dos plataformas (`youtube.com/watch`, `youtu.be`, `/shorts`, `/live`, `/embed`, iframes de YouTube, `vimeo.com/ID`, `/ID/HASH` no listado, `player.vimeo.com`, canales y grupos) y arma la URL del embed con el chrome de la plataforma al mínimo. La **misma** función valida en las Server Actions, así lo que queda guardado es siempre embebible.

`components/VideoPlayer.tsx` renderiza un poster propio (sticker de la forma de la Season sobre trama en el acento, cinta con el título) y **no monta el iframe hasta que se aprieta play** — ni un request a Google/Vimeo antes de que haya intención de mirar. Vertical (9:16) por defecto, configurable con `aspect`.

### Infinity

Cierra la primera temporada combinando las 5 Seasons anteriores: en vez de un color fijo, su página (`/eventos/infinity`) rota sutilmente entre el principal de Origin, Ascent, Bloom, Jungle y Eclipse (`components/RotatingAccent.tsx`, `getAccentsExcept`), reusando el mismo mecanismo de colores que consumen `Glyph`/`EventImage` en el resto del sitio.

## Rutas

- `/` — home: próximos viernes, ediciones anteriores, Experience, Lab.
- `/fechas` — los viernes en orden cronológico (destacado + lista completa); la repetición del nombre de cada Season con fecha distinta comunica la cadencia semanal.
- `/eventos/[slug]?fecha=YYYY-MM-DD` — detalle de **un** viernes de la Season (el que se clickeó): flyer, lineup y fotos de esa noche, con los colores de su Season. Sin `?fecha=` (o con una fecha que no es de esa Season) muestra el próximo viernes de la Season, y si ya pasaron todos, el último. Los links entran siempre con `?fecha=` desde `ArchiveCard` y `/fechas`.
- `/experience` — página de FORMAT Experience (fechas Experience de cada Season). Toma su acento de la **Season activa**, como el resto del sitio; el único subárbol con acento propio es el bloque destacado, que adopta el de *su* Season porque es historia y no tema global (lo mismo cada `<details>` del archivo). Ese bloque arranca **cerrado**: la página abre con la fecha y el venue a la vista, y el flyer, el line-up, el cocktail y la galería se despliegan con «Ver información».
- `/admin` — panel de carga (Supabase Auth email/password, sin registro público): Seasons y sus Fechas en acordeón, flyer/lineup/galería, colores con preview, URL del aftermovie y clips de FORMAT Lab en cada Experience.
- `/special` — comentada, no desarrollar hasta nuevo aviso.

### Portada del aftermovie de la home

La banda Experience usa el video y la portada de la Season activa por fechas.
`seasons.aftermovie_poster_path` guarda el objeto de `season-previews`; el tipo público expone `aftermoviePosterUrl`.
Aplicar manualmente `supabase/migrations/0016_aftermovie_poster.sql` y recargar /admin para habilitar «Portada del aftermovie» en una Season guardada.
La imagen se comprime con `compressToWebp / FLYER_COMPRESSION` y se guarda al elegirla; cada reemplazo tiene una URL nueva y revalida la home.
Antes de la migración, el sitio y el formulario siguen funcionando: Ascent usa `/images/aftermovie-ascent-portada.jpg` y Origin `/images/aftermovie-portada.png`.
Otras Seasons sin imagen usan la presentación existente del player con su forma y color; no heredan la portada de Origin.
Las imágenes anteriores permanecen en Storage; no se borran automáticamente. No se modifican portadas de otras secciones.

La intro Pulse se entrega completa por SSR y espera fuentes, visibilidad y dos frames. Guarda la sesión al completar o saltear. Las capas halftone se pintan una vez; Motion anima transform, opacity y clip-path. El shader espera al cierre y al siguiente idle. QA de producción local con CPU 4×: "node tests/pulse-intro-production.mjs", reporte en artifacts/pulse/intro-production/checks.json.
