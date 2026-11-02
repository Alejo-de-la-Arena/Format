import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { readStackEnv } from "./stack-env";
import { expectNoHorizontalScroll, watchIssues } from "./helpers";

// Suite de admin contra el Supabase LOCAL (proyecto format-qa). Cubre login y
// roles, escrituras con verificación de filas, orden DB→Storage al borrar,
// la migración 0019 (aplicada SÓLO en el stack local) y el JWT degradado.
// Ver tests/README.md para levantar el stack.

test.describe.configure({ mode: "serial" });

const env = readStackEnv();
const REPO = join(__dirname, "../..");
const svc: SupabaseClient = createClient(env.API_URL, env.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon: SupabaseClient = createClient(env.API_URL, env.ANON_KEY, { auth: { persistSession: false } });
const psql = (sql: string) => execFileSync("docker", ["exec", "-i", "supabase_db_format-qa", "psql", "-U", "postgres", "-v", "ON_ERROR_STOP=1", "-tA"], { input: sql }).toString().trim();

const NO_ROWS = "No se guardó: sin permisos o el registro ya no existe. Recargá el panel.";
const ORPHAN = "Se quitó de la web, pero el archivo quedó en Storage.";
const NO_ADMIN = "Esta cuenta no tiene permisos de admin.";
const ADMIN = { email: "admin@format-qa.local", password: randomBytes(18).toString("base64url") };
const USER = { email: "user@format-qa.local", password: randomBytes(18).toString("base64url") };
const ORIGINAL_CONCEPTO = "Concepto original";
const FLYER = "qa/2026-11-06.webp";
const FOTO = "qa/2026-11-06/qa-foto.webp";

const ADMIN_MEDIA = `bucket_id in ('flyers','galerias') and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'`;
/** Simula Storage caído para el admin: puede leer/subir pero no borrar. */
const blockStorageDelete = (allowInsert: boolean) => psql(`
  drop policy "admin write media" on storage.objects;
  create policy "qa admin select media" on storage.objects for select to authenticated using (${ADMIN_MEDIA});
  ${allowInsert ? `create policy "qa admin insert media" on storage.objects for insert to authenticated with check (${ADMIN_MEDIA});` : ""}`);
const restoreStorage = () => psql(`
  drop policy if exists "qa admin select media" on storage.objects;
  drop policy if exists "qa admin insert media" on storage.objects;
  create policy "admin write media" on storage.objects for all to authenticated using (${ADMIN_MEDIA}) with check (${ADMIN_MEDIA});`);

let adminId = "";
let seasonId = "";
let fecha1 = "";
let fecha2 = "";
let posterPath = "";
let ctx: BrowserContext;
let page: Page;
let issues: string[] = [];

const concepto = async () => (await svc.from("seasons").select("concepto").eq("id", seasonId).single()).data?.concepto;
const flyerInDb = async () => (await svc.from("fechas").select("flyer_path").eq("id", fecha1).single()).data?.flyer_path;
const objectExists = async (bucket: string, path: string) => (await svc.storage.from(bucket).exists(path)).data;
const fotosCount = async () => (await svc.from("fotos_galeria").select("id", { count: "exact", head: true }).eq("fecha_id", fecha1)).count;
const openFecha = (p: Page, i: number) => p.locator("li.py-3").nth(i).locator("button").first().click();
const storageImages = (p: Page) => p.evaluate(() => [...document.images]
  .filter((i) => i.src.includes("55321"))
  .map((i) => ({ src: i.src.split("/public/")[1], ok: i.complete && i.naturalWidth > 0 })));

async function login(p: Page, { email, password }: { email: string; password: string }) {
  await p.goto("/admin/login", { waitUntil: "load" });
  await p.getByLabel("Email").fill(email);
  await p.getByLabel("Contraseña").fill(password);
  await p.getByRole("button", { name: "Entrar" }).click();
}

async function ensureUser({ email, password }: { email: string; password: string }, appMetadata: object) {
  const { data } = await svc.auth.admin.listUsers({ perPage: 1000 });
  const existing = data.users.find((u) => u.email === email);
  if (existing) await svc.auth.admin.deleteUser(existing.id);
  const { data: created, error } = await svc.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: appMetadata });
  if (error) throw error;
  return created.user;
}

test.beforeAll(async ({ browser }) => {
  // Estado inicial = storage hasta 0018, para poder repetir la suite.
  psql(`
    drop policy if exists "public read flyers" on storage.objects;
    drop policy if exists "public read galerias" on storage.objects;
    drop policy if exists "public read season-previews" on storage.objects;
    create policy "public read flyers" on storage.objects for select using (bucket_id = 'flyers');
    create policy "public read galerias" on storage.objects for select using (bucket_id = 'galerias');
    create policy "public read season-previews" on storage.objects for select using (bucket_id = 'season-previews');`);

  adminId = (await ensureUser(ADMIN, { role: "admin" })).id;
  await ensureUser(USER, {});

  await svc.from("seasons").delete().eq("slug", "qa");
  const { data: season, error } = await svc.from("seasons").insert({
    slug: "qa", numero: "999", nombre: "QA", forma: "square", colores: ["#1E38F5"],
    concepto: ORIGINAL_CONCEPTO, fecha_inicio: "2026-11-01", fecha_fin: "2026-11-30",
  }).select("id").single();
  if (error) throw error;
  seasonId = season.id;
  posterPath = `${seasonId}/aftermovie-00000000-0000-4000-8000-000000000000.webp`;

  const webp = await sharp({ create: { width: 40, height: 50, channels: 3, background: "#1E38F5" } }).webp().toBuffer();
  for (const [bucket, path] of [["flyers", FLYER], ["galerias", FOTO], ["season-previews", posterPath]]) {
    const { error: upErr } = await svc.storage.from(bucket).upload(path, webp, { contentType: "image/webp", upsert: true });
    if (upErr) throw upErr;
  }
  const { data: fechas, error: fechasErr } = await svc.from("fechas").insert([
    { season_id: seasonId, fecha: "2026-11-06", flyer_path: FLYER },
    { season_id: seasonId, fecha: "2026-11-13" },
  ]).select("id, fecha").order("fecha");
  if (fechasErr) throw fechasErr;
  [fecha1, fecha2] = fechas.map((f) => f.id);
  await svc.from("fotos_galeria").insert({ fecha_id: fecha1, storage_path: FOTO, orden: 0 });
  await svc.from("lineup_slots").insert({ fecha_id: fecha1, orden: 0, artistas: ["QA DJ"] });

  ctx = await browser.newContext();
  page = await ctx.newPage();
  issues = watchIssues(page);
});

test.afterAll(async () => {
  await ctx?.close();
  await svc.from("seasons").delete().eq("slug", "qa");
});

test("sin sesión: /admin → /admin/login", async ({ browser }) => {
  const c = await browser.newContext();
  const p = await c.newPage();
  await p.goto("/admin", { waitUntil: "load" });
  expect(new URL(p.url()).pathname).toBe("/admin/login");
  await c.close();
});

test("usuario sin rol: login rechazado y sin sesión", async ({ browser }) => {
  const c = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p = await c.newPage();
  await login(p, USER);
  await expect(p.getByRole("alert").filter({ hasText: NO_ADMIN })).toBeVisible();
  expect(new URL(p.url()).pathname).toBe("/admin/login");
  await expectNoHorizontalScroll(p);
  // La sesión se cerró: /admin vuelve al login sin aviso.
  await p.goto("/admin", { waitUntil: "load" });
  expect(new URL(p.url()).pathname + new URL(p.url()).search).toBe("/admin/login");
  await c.close();
});

test("admin: login entra a /admin", async () => {
  await login(page, ADMIN);
  await page.waitForURL("**/admin");
  await expect(page.locator('[name="concepto"]')).toBeVisible();
});

test("admin: editar concepto, guardar y revertir", async () => {
  const field = page.locator('[name="concepto"]');
  const save = page.getByRole("button", { name: "Guardar Season" });
  await field.fill("Concepto QA editado");
  await save.click();
  await expect.poll(concepto).toBe("Concepto QA editado");
  await expect(save).toBeEnabled();
  await field.fill(ORIGINAL_CONCEPTO);
  await save.click();
  await expect.poll(concepto).toBe(ORIGINAL_CONCEPTO);
  await expect(save).toBeEnabled();
});

test("admin: imágenes cargan (antes de 0019)", async () => {
  await page.reload({ waitUntil: "load" });
  await openFecha(page, 0);
  await expect(page.locator('img[alt="Flyer"]')).toBeVisible();
  await expect.poll(async () => {
    const imgs = await storageImages(page);
    return imgs.length >= 2 && imgs.every((i) => i.ok);
  }, { message: "imágenes de Storage cargadas" }).toBe(true);
});

test("deleteFecha sobre fila ya borrada: muestra error, no falla en silencio", async () => {
  await svc.from("fechas").delete().eq("id", fecha2);
  const row = page.locator("li.py-3").nth(1);
  await row.getByRole("button", { name: "Borrar", exact: true }).click();
  await row.getByRole("button", { name: "Sí, borrar" }).click();
  await expect(row.getByRole("alert").filter({ hasText: NO_ROWS })).toBeVisible();
});

test("removeFlyer con Storage bloqueado: se quita de la web, avisa y el archivo queda", async () => {
  blockStorageDelete(true);
  try {
    await page.reload({ waitUntil: "load" });
    await openFecha(page, 0);
    await page.locator("button", { hasText: /^Quitar$/ }).click();
    await expect(page.getByRole("alert").filter({ hasText: ORPHAN })).toBeVisible();
    await expect(page.locator('img[alt="Flyer"]')).toHaveCount(0);
    expect(await flyerInDb(), "referencia quitada").toBeNull();
    expect(await objectExists("flyers", FLYER), "el archivo huérfano queda").toBe(true);
  } finally {
    restoreStorage();
  }
  await svc.from("fechas").update({ flyer_path: FLYER }).eq("id", fecha1);
});

const listAnon = async (bucket: string, prefix: string) => (await anon.storage.from(bucket).list(prefix)).data?.length ?? 0;
const publicStatus = async (bucket: string, path: string) => {
  const r = await fetch(anon.storage.from(bucket).getPublicUrl(path).data.publicUrl);
  return `${r.status} ${r.headers.get("content-type")}`;
};
const allLists = () => Promise.all([listAnon("flyers", "qa"), listAnon("galerias", "qa/2026-11-06"), listAnon("season-previews", seasonId)]);
const allPublic = () => Promise.all([publicStatus("flyers", FLYER), publicStatus("galerias", FOTO), publicStatus("season-previews", posterPath)]);

test("storage antes de 0019: anónimo puede listar, URL pública 200", async () => {
  expect((await allLists()).every((n) => n > 0)).toBe(true);
  for (const s of await allPublic()) expect(s).toMatch(/^200 image\/webp/);
});

test("aplicar 0019 en el Supabase local", async () => {
  psql(readFileSync(join(REPO, "supabase/migrations/0019_drop_public_read_storage_policies.sql"), "utf8"));
  const policies = psql("select string_agg(polname, ', ' order by polname) from pg_policy where polrelid='storage.objects'::regclass");
  expect(policies).not.toMatch(/public read/);
});

test("storage después de 0019: anónimo no lista, URL pública sigue 200", async () => {
  expect(await allLists()).toEqual([0, 0, 0]);
  for (const s of await allPublic()) expect(s).toMatch(/^200 image\/webp/);
});

test("admin después de 0019: imágenes cargan en el navegador", async () => {
  await page.reload({ waitUntil: "load" });
  await openFecha(page, 0);
  await expect(page.locator('img[alt="Flyer"]')).toBeVisible();
  await expect.poll(async () => {
    const imgs = await storageImages(page);
    return imgs.length >= 2 && imgs.every((i) => i.ok);
  }, { message: "imágenes de Storage cargadas" }).toBe(true);
});

test("admin después de 0019: portada (season-previews) carga por URL pública", async ({ browser }) => {
  const c = await browser.newContext();
  const p = await c.newPage();
  const url = anon.storage.from("season-previews").getPublicUrl(posterPath).data.publicUrl;
  await p.setContent(`<img id="i" src="${url}">`);
  await p.waitForFunction(() => (document.getElementById("i") as HTMLImageElement).complete);
  expect(await p.evaluate(() => (document.getElementById("i") as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await c.close();
});

test("admin después de 0019: quitar flyer borra archivo y referencia", async () => {
  await page.locator("button", { hasText: /^Quitar$/ }).click();
  await expect(page.locator('img[alt="Flyer"]')).toHaveCount(0);
  await expect.poll(flyerInDb).toBeNull();
  await expect.poll(() => objectExists("flyers", FLYER)).toBe(false);
});

test("deleteFoto con Storage bloqueado: se quita de la web, avisa y el archivo queda", async () => {
  const tile = page.locator("li.aspect-square").first();
  // La confirmación en mobile tiene que entrar en pantalla.
  await page.setViewportSize({ width: 390, height: 844 });
  await tile.locator("button", { hasText: /^×$/ }).click();
  const yes = tile.locator("button", { hasText: "Sí, borrar" });
  await yes.scrollIntoViewIfNeeded();
  const box = await yes.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  await expectNoHorizontalScroll(page);
  await tile.locator("button", { hasText: "Cancelar" }).click();
  await page.setViewportSize({ width: 1440, height: 900 });

  blockStorageDelete(false);
  try {
    await tile.locator("button", { hasText: /^×$/ }).click();
    await tile.locator("button", { hasText: "Sí, borrar" }).click();
    await expect(page.getByRole("alert").filter({ hasText: ORPHAN })).toBeVisible();
    await expect(page.locator("li.aspect-square")).toHaveCount(0);
    expect(await fotosCount(), "fila borrada").toBe(0);
    expect(await objectExists("galerias", FOTO), "el archivo huérfano queda").toBe(true);
  } finally {
    restoreStorage();
  }
  await svc.from("fotos_galeria").insert({ fecha_id: fecha1, storage_path: FOTO, orden: 0 });
});

test("admin después de 0019: borrar foto de galería borra fila y archivo", async () => {
  await page.reload({ waitUntil: "load" });
  await openFecha(page, 0);
  const tile = page.locator("li.aspect-square").first();
  await expect(tile).toBeVisible();
  await tile.locator("button", { hasText: /^×$/ }).click();
  await tile.locator("button", { hasText: "Sí, borrar" }).click();
  await expect(page.locator("li.aspect-square")).toHaveCount(0);
  await expect.poll(fotosCount).toBe(0);
  await expect.poll(() => objectExists("galerias", FOTO)).toBe(false);
});

test("admin degradado con JWT viejo: guardar rebota a login y la DB no cambia", async () => {
  // El access token de la cookie todavía dice role=admin; requireAdmin
  // consulta Auth y lo frena antes de que RLS lo deje pasar.
  await svc.auth.admin.updateUserById(adminId, { app_metadata: { role: "user" } });
  await page.locator('[name="concepto"]').fill("NO DEBERÍA GUARDARSE");
  await page.getByRole("button", { name: "Guardar Season" }).click();
  await page.waitForURL(/\/admin\/login\?error=sin-permisos/);
  await expect(page.getByRole("alert").filter({ hasText: NO_ADMIN })).toBeVisible();
  expect(await concepto()).toBe(ORIGINAL_CONCEPTO);
  await page.goto("/admin", { waitUntil: "load" });
  expect(new URL(page.url()).pathname + new URL(page.url()).search).toBe("/admin/login?error=sin-permisos");
});

test("sin errores de consola en la sesión admin", async () => {
  expect(issues).toEqual([]);
});
