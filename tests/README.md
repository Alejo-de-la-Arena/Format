# Tests

| Script | Qué corre | Contra qué |
|---|---|---|
| `npm run test:unit` | `tests/*.test.mjs` (node:test) | código fuente, sin servidor |
| `npm run test:e2e:public` | `tests/e2e/public.spec.ts` (Playwright) | build de producción local, datos del Supabase de `.env.local` (sólo lectura) |
| `npm run test:e2e:admin` | `tests/e2e/admin.spec.ts` (Playwright) | build contra un Supabase **local** aislado (Docker) |

Los archivos `tests/*.mjs` sin `.test` son scripts de QA visual sueltos de otras features; no forman parte de ninguna suite.

La primera vez: `npx playwright install chromium chromium-headless-shell`.

## Suite pública

Proyectos `public-1440`, `public-390` (táctil) y `public-360` (sólo las rutas, tag `@rutas`). Cubre:

- Home: la intro de la Season activa arranca y cierra sola, y el hero WebGL se dibuja.
- `/eventos/pulse`, `/eventos/ascent`, `/experience`, `/calendario`, `/proximas-fechas`, `/about`: 200, consola sin errores y sin scroll horizontal.
- `/experience`: un tile abre y cierra (el foco vuelve al tile).
- Galería de una fecha pasada: "Guardar" entrega un WebP válido (descarga en desktop, share sheet en táctil). En táctil, el hint aparece, el swipe lo oculta y navega en los dos sentidos sin salir de la página; sin swipe, el temporizador también lo oculta.
- `/admin` sin sesión redirige al login.

```sh
# Build en un dist aparte para no pisar el .next del dev server
FORMAT_QA_DIST=.next-qa-public npm run build
git checkout -- tsconfig.json   # el build le agrega .next-qa-public/types al include
FORMAT_QA_DIST=.next-qa-public npm run test:e2e:public
```

El config levanta `next start` en el puerto 3100 (o reutiliza uno que ya esté corriendo ahí).

**Avisos conocidos.** `tests/e2e/helpers.ts` tiene una lista `KNOWN` con avisos de consola que ya están en `main`: no fallan el test pero quedan anotados en el reporte ("aviso conocido"). Hoy es uno solo: Chrome avisa cuando el CSS que precarga el prefetch de un `<Link>` del nav no se usa en unos segundos.

### Pendiente

- [ ] **"preloaded but not used" (CSS de `/about` y `/experience`).** Viene de `main` (reproducido en `/eventos/ascent` con un build de `main`), no bloquea. Resolverlo en una branch aparte y, cuando esté, sacar el patrón de `KNOWN` en `tests/e2e/helpers.ts` para que vuelva a fallar si reaparece.

## Suite de admin

17 casos en serie: login y roles, escrituras con verificación de filas, orden DB→Storage al borrar flyer y foto (con Storage bloqueado a propósito), la migración 0019 de Storage y el JWT degradado. **Nunca toca producción**: todo corre contra un stack Supabase local en Docker.

Requisitos: Docker Desktop corriendo y el Supabase CLI (`scoop install supabase`).

```sh
node tests/e2e/admin-stack.mjs up      # stack "format-qa" desde cero con supabase/migrations
node tests/e2e/admin-stack.mjs build   # build en .next-qa-admin contra el stack (sin Turnstile)
npm run test:e2e:admin                 # next start en :3200 + los 17 casos
node tests/e2e/admin-stack.mjs down    # apaga y borra los datos del stack
```

- El stack vive en `%TEMP%/format-qa-supabase` (o en `FORMAT_QA_SUPABASE_DIR`) con `project_id = "format-qa"` y puertos 553xx, para no chocar con otros proyectos Supabase locales. La config es `tests/e2e/supabase-qa/config.toml`.
- `up` copia todas las migraciones del repo con prefijo de timestamp, como pide el CLI. La suite vuelve a crear las policies públicas de Storage al empezar, así que mide el antes y el después de 0019 aunque el stack ya la tenga aplicada.
- No corras `supabase` con el cwd en el repo: crea `supabase/.temp/`.
- La URL del stack se valida (`127.0.0.1:55321`); si apunta a otro lado, la suite no arranca.
