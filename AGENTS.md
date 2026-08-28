# AGENTS.md — FORMAT

Sitio de FORMAT, el ciclo de música electrónica de los viernes en Av. Costanera Rafael Obligado 4801 (Buenos Aires).

Web **informativa**: no vende entradas. Recibe tráfico de Instagram y responde dos cosas rápido — **qué viernes viene** y **cómo fueron los anteriores**.

---

## Principio rector

> El flyer es el contenido. El texto sale del camino.

Cada flyer ya trae fecha, lineup, venue y sponsors. La web muestra el flyer y agrega lo mínimo. No describimos la marca, no explicamos la paleta, no narramos el concepto.

**Nunca** en pantalla: paletas con nombres, listas de estética/escenografía, jerga interna ("sistema", "los 6 componentes", "modelo operativo"), ni nada de negocio.

**Sí**: nombre de la Season, número de edición, fecha, venue, lineup, cocktail (nombre + una línea), fotos, sets.

---

## Identidad visual

FORMAT es **zine, fotocopia, collage de stickers**. Impreso, no digital. Alto contraste, grano, capas.

**No es**: club minimalista negro, futurismo, degradados suaves, glassmorphism, ni nada que parezca plantilla. Ante la duda, más crudo y más impreso.

### Mecanismos visuales (esto es la marca)

1. **Bloques de cinta.** Rectángulos sólidos en negro con el texto calado en gris papel. Ligeramente rotados (-3° a 3°), superpuestos entre sí, con los bordes irregulares como recortados. Es el tratamiento tipográfico principal para títulos y datos.
2. **Sticker de forma.** La forma geométrica de la Season (cuadrado en Origin, triángulo en Ascent, hexágono en Bloom, etc.) repetida en el color de acento, rotada en ángulos distintos, esparcida como patrón de fondo. Muchas llevan el logo adentro. **Este es el sistema de formas de FORMAT en la web.**
3. **Textura de papel.** Grano visible sobre el fondo, como fotocopia. Nunca un color plano perfecto.
4. **Duotono.** Las fotos van en alto contraste, tramadas, teñidas en el acento de la Season y negro.
5. **Rotación y superposición.** Casi nada está perfectamente alineado a la grilla. Los elementos se pisan.

---

## Sistema de diseño (tokens — no inventar otros)

```
--paper:  #C8D0D2   /* fondo, gris papel frío — fijo */
--ink:    #111111   /* negro de bloques y texto — fijo */
--paper-2:#DDE3E4   /* papel más claro, variante — fijo */

--accent-1 … --accent-5   /* vienen de la Season activa, ver abajo */
```

Valores de papel/tinta aproximados: **confirmar contra el manual de marca**.

- Gris papel, negro y sus variantes son **constantes del sistema**. No cambian nunca.
- El color lo pone **la Season**, no el sitio. FORMAT no tiene un acento fijo.

### Colores por Season

Cada Season carga hasta 5 hex en orden. Roles por posición:

| # | Rol |
|---|---|
| 1 | Acento principal — stickers de forma, links, botones, bordes activos |
| 2 | Secundario — hovers, estados activos, badges |
| 3 | Gradientes, glows suaves, fondos teñidos |
| 4 | Detalle — líneas finas, dividers, subrayados |
| 5 | Highlight puntual |

Si una Season carga menos de 5, completar los faltantes reutilizando el principal.

**Alcance:** todo el sitio toma los colores de la **Season activa** (la que contiene la fecha de hoy; si estamos entre dos, la próxima; si todas pasaron, la última). Única excepción: `/eventos/[slug]`, que adopta los colores de **su propia** Season.

Origin = azul eléctrico (≈ `#1E38F5`, confirmar con el manual).

### Tipografía

- **Inter** — única fuente del sitio. Datos, fechas, lineup, navegación, cuerpo, títulos. En mayúsculas y peso alto dentro de los bloques de cinta.
- Nada fuera de Inter. No hay fuente display: el trazo a mano de la marca lo aporta el **wordmark FORMAT vectorizado** (`public/logos/logo-format-columna.svg` apilado, `public/logos/logo-format-horizontal.svg` en línea), usado en header, hero y footer.
- ✔️ Licencia resuelta: al ser SVG con las curvas ya convertidas no se sirve ninguna webfont. Ya no hace falta comprar CS Miska. Los `.svg` de `public/logos/` son los definitivos de marca — no editarlos.

### Espaciado

Escala base 4px. Composición densa y superpuesta antes que aireada y prolija — pero legible siempre.

---

## Motion

- Librería: **Motion** (framer-motion) para entradas/transiciones de UI.
- **three.js sólo en el fondo del hero.** Un único plano a pantalla completa con shader GLSL custom (nada de partículas ni geometría instanciada): trama halftone donde la forma de la Season activa se arma y disuelve en loop, deformada por domain-warping de ruido sobre un SDF de la forma. Color: `--accent-1` sobre papel. Reacciona sutil a scroll/puntero. No vive en ningún otro lado del sitio.
- El movimiento imita papel: entradas con rotación mínima, desplazamientos secos, stickers que aparecen escalonados. Nada de easing flotante ni parallax suave.
- Duraciones 150–400ms.
- Toda animación respeta `prefers-reduced-motion`.
- Si una animación no ayuda a entender o navegar, no va.

---

## Piso de calidad (obligatorio en cada entrega)

- Responsive real hasta 360px. Probar mobile SIEMPRE.
- Contraste suficiente: texto negro sobre gris papel, texto papel sobre bloques negros. Verificar legibilidad del acento sobre papel.
- Foco de teclado visible; navegable sin mouse.
- Imágenes con `next/image`, `alt` correcto, dimensiones definidas.
- Estados vacíos que invitan ("Todavía no hay fotos de esta noche"), no en blanco.
- Sin errores ni warnings en consola.

## Verificación visual (usar Playwright)

Al terminar una vista, ANTES de decir que está lista:
1. Levantá el dev server.
2. Screenshot en **desktop (1440)** y **mobile (390)**.
3. Compará contra el flyer de Origin en `reference/` y contra este sistema.
4. Ajustá hasta que coincida. Recién ahí, reportá.

No entregues una vista sin haberla mirado renderizada.

---

## Voz

Español, frases cortas, directas. Nada de vender, nada de jerga.
- Bien: "Origin · Viernes 7 de agosto · Av. Costanera Rafael Obligado 4801"
- Mal: "Season 01 · Paleta azul eléctrico · Arquitectura lumínica"

Botones dicen lo que hacen: "Ver evento", "Ver fechas".

---

## Modelo: Seasons mensuales, no eventos puntuales

FORMAT pasa **todos los viernes**. Cada nombre (Origin, Ascent, Bloom, Jungle, Eclipse, Infinity) es una **Season de ~1 mes** que agrupa varios viernes bajo el mismo concepto, forma, paleta y cocktail, con el primer viernes como apertura.

- Una Season = un slug = una página `/eventos/[slug]`, que cubre todos sus viernes.
- Cada viernes es una fecha dentro de la Season (`fecha` única), con flag `especial` en la apertura.
- `/fechas` lista los viernes en cronológico; los de la misma Season linkean a la misma página. La cadencia se comunica por repetición visual, no con texto.

### Lineup

Cada fila de lineup es un **slot**, no un artista: tiene orden, horarios opcionales y una lista de artistas. Un slot con dos o más artistas se renderiza como back-to-back ("Tomás b2b Malva"). La cantidad de slots por fecha es libre.

---

## Stack y convenciones

- Next.js (App Router) + TypeScript + Tailwind. Deploy en Vercel.
- Datos y auth: **Supabase** (proyecto `format-jet`). Tablas `seasons`, `fechas`, `lineup`, `fotos`.
- Storage: buckets `flyers` y `galerias`. Compresión a WebP del lado del cliente antes de subir.
- Sets: embed de YouTube a partir de la URL guardada por fecha.
- Tipos en `lib/types.ts`. Al cambiar el modelo, actualizar el README.
- Archivos y rutas en inglés; copy visible en español.

## Flujo de trabajo

- Antes de una feature nueva: plan en 3–5 puntos y esperar OK.
- Cambios acotados. No refactorizar de más sin pedirlo.
- Al cerrar un bloque: `code-review` sobre lo tocado y linter.
- Commits chicos, en español, imperativo.

## Special (no tocar por ahora)

`/special` y su navegación quedan comentados.