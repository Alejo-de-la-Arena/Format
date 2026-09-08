# ASCENT — verificación

Implementación lista para recibir la Season creada desde admin. No se modificaron datos, RLS ni migraciones de Supabase. Pulse conserva su constante original, incluida la cruz.

## Auditoría y correcciones

- `app/globals.css`: cinco `initial-value` de Origin (`#1E38F5`, `#5470FF`, `#B9C4FF`, `#14247A`, `#2EE6E6`) reemplazados por tinta neutra. Los alias Tailwind se resolvían en la raíz y retenían ese color: ahora usan `@theme inline` para respetar cada Season y los detalles históricos.
- `app/experience/experience.module.css`, `components/agenda/agenda.module.css`, `components/BackButton.tsx`, `components/GlitchText.tsx` y estilos globales: referencias a esos alias heredados reemplazadas por `--accent-1..5`. Abarca fondos, bordes, foco, sombras, títulos y estados de interacción. El footer ya usaba clases de acento; quedó corregido al arreglar la herencia global.
- `app/admin/(protected)/_components/SeasonForm.tsx`: azul inicial de Origin y placeholder de bienvenida específico reemplazados por valores neutrales. Triángulo ya estaba disponible.
- `lib/season-intro.ts`, `lib/data/seasons.ts`, `app/layout.tsx`, `app/page.tsx`: selección unificada; el hero y la sección informativa ya no quedan en Origin cuando la próxima Season pasa a ser la activa durante un intervalo. Bienvenida genérica desde el nombre real, sin excepción para Origin.
- `components/WhatIsFormat.tsx`: condición exclusiva de Origin, nombre fijo de Ascent, violeta literal y dos paths de triángulo invertido reemplazados por datos y `getShapePath`. Se resuelve en servidor sólo el adelanto siguiente; no se envía el catálogo completo.
- `lib/season-sequence.ts`: actualizada únicamente la paleta de Ascent a los cinco valores solicitados. Origin conserva su identidad histórica y Pulse no tiene cambios.
- `components/home/SeasonIntro.tsx` y su CSS: retirada la inversión `scale: 1 -1`; transición ascendente de 2,8 segundos entre identidades reales. «It was time to ascend» seguido de «Welcome to Ascent». Misma clave de sesión, Escape y entrada directa con movimiento reducido. El nombre Ascent sólo determina la frase inicial; formas, colores y bienvenida salen de los datos.
- `components/HeroBackground.tsx`: la forma ya provenía de la Season; se corrigió el reflejo de la variante repetida para no invertir triángulos. Se conservan tiempo, trama, recorrido, opacidad y pausas de WebGL.
- `components/Nav.tsx` y detalle de evento: header y menú del detalle ahora toman su propia Season. `components/ArchiveCard.tsx`: el hover también conserva el acento histórico. Los flyers mantienen sus ajustes de tamaño y encuadre.

Los cuadrados geométricos del catálogo, el jitter, los marcos de papel y los contenedores de imágenes no son hardcodeos decorativos de Origin. `reference/prototype.html` es un prototipo ajeno al runtime y no se modificó. En `reference/` no estaban el flyer de Origin ni el manual de marca mencionado por AGENTS.md.

## Validación

- Build final con Node directo (`next build`, equivalente a `npm run build`): pasó, con acceso a las lecturas públicas reales de Supabase; generó `/eventos/origin`.
- El build desde caché vacía advierte sobre `process.version` dentro de la dependencia Supabase en Edge Runtime (middleware existente) y sobre serialización de caché de Webpack. No son errores de consola del navegador ni se modificó ese middleware.
- `tsc --noEmit`, ejecutado con Node directo: pasó.
- `node --test tests/*.test.mjs`: 11 pruebas, todas pasan.
- Revisión manual del diff y `git diff --check`: sin observaciones pendientes. No hay ESLint instalado ni script de lint configurado; no se afirma una ejecución independiente de ESLint.
- Playwright a 1440, 390 y 360 px: acento de Ascent, detalle de Origin azul, sin desborde horizontal, sin identidades posteriores al adelanto en el DOM, persistencia y movimiento reducido verificados. Última pasada sin errores ni warnings de consola: [checks.json](checks.json).
- `triangle` está permitido en el CHECK de `supabase/migrations/0001_init.sql`. No se necesita SQL nuevo según las migraciones del repositorio; no se inspeccionó el CHECK desplegado mediante una conexión SQL administrativa.

## Capturas

Capturas de Ascent con fixtures locales; no representan una Season publicada. Los frames de intro se congelaron a 400, 1050 y 2100 ms, usando sus animaciones CSS reales.

- Intro desktop: [Origin](1440-intro-01-origin.png), [transición](1440-intro-02-transition.png), [Ascent](1440-intro-03-ascent.png).
- Intro mobile: [Origin](390-intro-01-origin.png), [transición](390-intro-02-transition.png), [Ascent](390-intro-03-ascent.png).
- Hero: [desktop](1440-hero.png), [390 px](390-hero.png), [360 px](360-hero.png).
- Header: [desktop](1440-header.png), [mobile](390-header.png). Menú: [390 px](390-menu.png), [360 px](360-menu.png). A 1440 px se muestra la navegación completa, sin hamburguesa.
- Qué es FORMAT: [desktop](1440-about.png), [390 px](390-about.png), [360 px](360-about.png).
- Footer: [desktop](1440-footer.png), [mobile](390-footer.png).
- Origin con Ascent activa, usando fixtures: [desktop](1440-origin.png), [mobile](390-origin.png).
- Origin con datos y flyers reales desde el build local: [desktop](1440-origin-real.png), [mobile](390-origin-real.png). Acento real comprobado: `#051FE6`; identidad cuadrada preservada.
