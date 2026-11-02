import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";
import { expectNoHorizontalScroll, isWebp, watchIssues } from "./helpers";

// Suite pública. Corre en 1440 y 390 (y las rutas también en 360, ver
// public.config.ts) contra un build de producción local. Sólo lectura: usa
// los datos del Supabase configurado en .env.local, no escribe nada.
//
// Sin esperas fijas: todo se espera por estado (toBeVisible/toBeHidden,
// waitForFunction, expect.poll).

/** La intro se muestra una vez por sesión; fuera de su test la salteamos. */
async function skipIntro(page: Page) {
  await page.addInitScript(() => {
    const getItem = Storage.prototype.getItem;
    Storage.prototype.getItem = function (key: string) {
      return key.startsWith("format:visit-intro:") ? "1" : getItem.call(this, key);
    };
  });
}

const isMobile = (name: string) => name !== "public-1440";

test.describe("home", () => {
  test("la intro de la season activa arranca y cierra, y el hero se dibuja", async ({ page, baseURL }) => {
    const issues = watchIssues(page, baseURL);
    const res = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);

    const intro = page.locator('dialog[aria-labelledby="season-welcome"]');
    await expect.poll(() => intro.evaluate((d: HTMLDialogElement) => d.open), { message: "intro abierta" }).toBe(true);
    await expect(page.locator("#season-welcome")).toBeVisible();
    // La intro termina sola (sin skip) y cierra el diálogo.
    await expect.poll(() => intro.evaluate((d: HTMLDialogElement) => d.open).catch(() => false), {
      message: "intro cerrada", timeout: 30_000,
    }).toBe(false);

    // Hero: el canvas del shader tiene tamaño y pinta algo (no es un plano liso).
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 30_000 });
    const box = await canvas.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(200);
    await expect.poll(async () => {
      const { channels } = await sharp(await canvas.screenshot()).stats();
      return Math.max(...channels.slice(0, 3).map((c) => c.stdev));
    }, { message: "el hero se dibuja", timeout: 30_000 }).toBeGreaterThan(8);

    await expectNoHorizontalScroll(page);
    expect(issues).toEqual([]);
  });
});

const ROUTES = ["/eventos/pulse", "/eventos/ascent", "/experience", "/calendario", "/proximas-fechas", "/about"];

test.describe("rutas", () => {
  test.beforeEach(async ({ page }) => skipIntro(page));

  for (const route of ROUTES) {
    test(`${route}: 200, consola limpia y sin scroll horizontal`, { tag: "@rutas" }, async ({ page, baseURL }) => {
      const issues = watchIssues(page, baseURL);
      const res = await page.goto(route, { waitUntil: "load" });
      expect(res?.status()).toBe(200);
      await expect(page.locator("main").first()).toBeVisible();
      await page.waitForLoadState("networkidle");
      expect((await page.locator("main").first().innerText()).length).toBeGreaterThan(50);
      await expectNoHorizontalScroll(page);
      expect(issues).toEqual([]);
    });
  }
});

test.describe("experience", () => {
  test.beforeEach(async ({ page }) => skipIntro(page));

  test("un tile abre y cierra", async ({ page, baseURL }) => {
    const issues = watchIssues(page, baseURL);
    await page.goto("/experience", { waitUntil: "load" });
    const tile = page.locator("[data-experience-grid] button").first();
    await tile.scrollIntoViewIfNeeded();
    await tile.click();
    const panel = page.locator("[data-experience-panel]");
    await expect(panel).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel).toHaveCount(0);
    await expect(tile).toBeFocused();
    await expectNoHorizontalScroll(page);
    expect(issues).toEqual([]);
  });
});

test.describe("galería de una fecha pasada", () => {
  // next start optimiza cada tamaño de foto la primera vez: puede tardar.
  test.describe.configure({ timeout: 180_000 });
  test.beforeEach(async ({ page }) => skipIntro(page));

  async function openGallery(page: Page, beforeOpen?: () => Promise<void>) {
    await page.goto("/eventos/ascent", { waitUntil: "load" });
    await beforeOpen?.();
    await page.evaluate(() => document.querySelectorAll("details").forEach((d) => { d.open = true; }));
    const thumb = page.locator('button[aria-label^="Ampliar foto"]').first();
    await thumb.scrollIntoViewIfNeeded();
    await thumb.click();
    const dialog = page.locator("dialog[open]");
    await expect(dialog.locator("img").first()).toBeVisible();
    return dialog;
  }

  test('"Guardar" entrega un WebP válido', async ({ page, baseURL }, testInfo) => {
    const issues = watchIssues(page, baseURL);
    const mobile = isMobile(testInfo.project.name);
    if (mobile) {
      // En táctil Guardar abre el share sheet nativo: lo interceptamos y
      // capturamos el archivo que se compartiría.
      await page.addInitScript(() => {
        const w = window as unknown as { __shared?: number[] };
        Object.defineProperty(navigator, "canShare", { configurable: true, value: () => true });
        Object.defineProperty(navigator, "share", {
          configurable: true,
          value: async ({ files }: { files: File[] }) => {
            w.__shared = Array.from(new Uint8Array(await files[0].arrayBuffer()));
          },
        });
      });
    }
    const dialog = await openGallery(page);
    const save = dialog.getByRole("button", { name: "Guardar foto" });

    let bytes: Buffer;
    let name: string;
    if (mobile) {
      await save.click();
      await expect.poll(() => page.evaluate(() => (window as unknown as { __shared?: number[] }).__shared?.length ?? 0))
        .toBeGreaterThan(0);
      bytes = Buffer.from(await page.evaluate(() => (window as unknown as { __shared: number[] }).__shared));
      name = "share sheet";
    } else {
      const [download] = await Promise.all([page.waitForEvent("download"), save.click()]);
      name = download.suggestedFilename();
      expect(name).toMatch(/^format-ascent-\d{4}-\d{2}-\d{2}-1\.webp$/);
      await download.saveAs(testInfo.outputPath(name));
      bytes = await readFile(testInfo.outputPath(name));
    }
    expect(isWebp(bytes), `${name}: cabecera WebP`).toBe(true);
    const meta = await sharp(bytes).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width ?? 0).toBeGreaterThan(0);

    await page.keyboard.press("Escape");
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    expect(issues).toEqual([]);
  });

  test("390: el hint aparece, el swipe lo oculta y navega en los dos sentidos sin salir", async ({ page, baseURL, context }, testInfo) => {
    test.skip(!isMobile(testInfo.project.name), "sólo táctil");
    const issues = watchIssues(page, baseURL);
    // Reloj falso: el temporizador del hint (4,5 s) sólo avanza cuando lo
    // pedimos. Así "lo ocultó el swipe" no depende de cuánto tarde la foto.
    const dialog = await openGallery(page, () => page.clock.install());
    const hint = page.locator("[data-touch-hint]");
    await expect(hint).toBeVisible();

    const counter = dialog.getByText(/^\d+ \/ \d+$/);
    const total = Number((await counter.textContent())!.split("/")[1]);
    expect(total).toBeGreaterThan(1);
    const box = (await dialog.locator("img").first().boundingBox())!;
    const y = box.y + box.height / 2;
    const cdp = await context.newCDPSession(page);
    const swipe = async (from: number, to: number) => {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: from, y }] });
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: to, y }] });
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    };
    const url = page.url();

    await swipe(box.x + box.width * 0.8, box.x + box.width * 0.2);
    await expect(counter).toHaveText(`2 / ${total}`);
    // 400 ms de reloj: alcanza para la salida (200 ms), no para el temporizador.
    await page.clock.runFor(400);
    await expect(hint).toBeHidden();

    await swipe(box.x + box.width * 0.2, box.x + box.width * 0.8);
    await expect(counter).toHaveText(`1 / ${total}`);
    await swipe(box.x + box.width * 0.2, box.x + box.width * 0.8);
    await expect(counter).toHaveText(`${total} / ${total}`);

    expect(page.url()).toBe(url);
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("dialog[open]")).toHaveCount(0);

    // Sin swipe, el hint también se va solo al cumplirse el temporizador.
    await page.locator('button[aria-label^="Ampliar foto"]').first().click();
    await expect(hint).toBeVisible();
    await page.clock.runFor(4_800);
    await expect(hint).toBeHidden();
    await page.keyboard.press("Escape");
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await expectNoHorizontalScroll(page);
    expect(issues).toEqual([]);
  });
});

test("/admin sin sesión redirige al login", async ({ page, baseURL }) => {
  const issues = watchIssues(page, baseURL);
  await page.goto("/admin", { waitUntil: "load" });
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByLabel("Email")).toBeVisible();
  await expectNoHorizontalScroll(page);
  expect(issues).toEqual([]);
});
