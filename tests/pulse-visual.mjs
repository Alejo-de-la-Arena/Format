import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const { chromium } = await import(process.env.FORMAT_PLAYWRIGHT
  ? pathToFileURL(process.env.FORMAT_PLAYWRIGHT).href : "playwright");
const browser = await chromium.launch({ headless: true, args: ["--enable-unsafe-swiftshader"],
  ...(process.env.FORMAT_CHROME ? { executablePath: process.env.FORMAT_CHROME } : {}),
});
const base = process.env.FORMAT_PREVIEW_URL || "http://127.0.0.1:4312";
const out = "artifacts/pulse";
await mkdir(out, { recursive: true });
const issues = [];
const knownDevIssues = new Set();
const checks = [];
const observe = (page) => {
  page.on("pageerror", (error) => issues.push(`${page.url()}: ${error.stack || error.message}`));
  page.on("console", (message) => {
    if (!["warning", "error"].includes(message.type())) return;
    const text = message.text();
    // Existing dev-only Vercel telemetry is blocked by the repo's unchanged CSP.
    if (/Loading the script 'https:\/\/va\.vercel-scripts\.com\/v1\/(speed-insights\/)?script\.debug\.js' violates the following Content Security Policy/.test(text)) {
      knownDevIssues.add(text);
    } else if (/Image with src "https:\/\/omwzsphshgrcbxdcghli\.supabase\.co\/storage\/v1\/object\/public\/flyers\/ascent\/.*was detected as the Largest Contentful Paint/.test(text)
      || text.startsWith("You have Reduced Motion enabled on your device.")) {
      knownDevIssues.add(text);
    } else issues.push(`${page.url()}: ${text}`);
  });
};
const accent = (locator) => locator.evaluate((e) => getComputedStyle(e).getPropertyValue("--accent-1").trim().toLowerCase());
const red = (value) => ["#e5233b", "rgb(229, 35, 59)"].includes(value);
const violet = (value) => ["#7b3fe4", "rgb(123, 63, 228)"].includes(value);
async function visit(page, path) {
  const response = await page.goto(`${base}${path}`, { waitUntil: "load", timeout: 90000 });
  assert.equal(response.status(), 200, path);
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await page.waitForFunction(() => !document.querySelector("dialog[open]"));
  await page.waitForTimeout(900);
  await page.waitForFunction(() => !document.querySelector("dialog[open]"));
}
async function noOverflow(page) {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Horizontal overflow");
}

try {
  for (const width of [1440, 390, 360]) {
    console.log("Viewport", width);
    const context = await browser.newContext({ viewport: { width, height: width > 600 ? 900 : 844 } });
    const page = await context.newPage(); observe(page);
    await visit(page, "/");
    assert.ok(red(await accent(page.locator("body"))));
    await page.locator('canvas[data-motion="running"]').waitFor();
    await page.screenshot({ path: `${out}/${width}-home.png`, fullPage: true });
    await page.locator("header").first().screenshot({ path: `${out}/${width}-hero.png` });
    const about = page.locator("section").filter({ has: page.getByRole("heading", { name: "Qué es FORMAT", exact: true }) });
    await about.scrollIntoViewIfNeeded(); await page.waitForTimeout(500);
    assert.match(await about.innerText(), /003 PULSE/);
    assert.match(await about.innerText(), /Cada mes la terraza cambia por completo\./);
    assert.equal(await about.locator('svg[viewBox="0 0 100 100"] circle').count(), 6);
    assert.equal(await about.getByLabel("Próximamente").locator("text").count(), 2);
    await about.screenshot({ path: `${out}/${width}-about.png` });
    await noOverflow(page);
    if (width < 768) {
      await page.getByRole("button", { name: "Abrir menú" }).click();
      await page.getByRole("dialog", { name: "Menú" }).waitFor();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${out}/${width}-menu.png` });
      await page.keyboard.press("Escape");
    }
    // Keyboard navigation still exposes focus on the first home link.
    await page.locator('a[aria-label="FORMAT — inicio"]').focus();
    await page.keyboard.press("Tab");
    assert.ok(await page.evaluate(() => document.activeElement?.matches(":focus-visible")));

    await visit(page, "/eventos/ascent");
    assert.ok(violet(await accent(page.locator("main"))));
    assert.equal(await page.locator("nav").first().evaluate((e) => getComputedStyle(e).getPropertyValue("--header-accent").trim().toLowerCase()), "#7b3fe4");
    await page.screenshot({ path: `${out}/${width}-ascent.png`, fullPage: true });
    await noOverflow(page);

    await visit(page, "/fechas");
    assert.ok(red(await accent(page.locator("body"))));
    for (const day of ["09", "16", "23", "30"]) {
      assert.ok(await page.locator(`a[href="/eventos/pulse?fecha=2026-10-${day}"]`).count(), `Pulse ${day}.10`);
    }
    await page.screenshot({ path: `${out}/${width}-fechas.png`, fullPage: true });
    await noOverflow(page);

    await visit(page, "/archivo");
    assert.ok(red(await accent(page.locator("body"))));
    assert.ok(await page.locator('a[href^="/eventos/ascent"]').count(), "Ascent remains in the archive");
    await page.screenshot({ path: `${out}/${width}-archivo.png`, fullPage: true });
    await noOverflow(page);
    checks.push({ width, home: "Pulse", historicalDetail: "Ascent violet", dates: "9,16,23,30", archive: "preserved", overflow: false });
    await context.close();
  }

  const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
  const page = await context.newPage(); observe(page);
  await visit(page, "/");
  const canvas = page.locator('canvas[data-motion="paused"]'); await canvas.waitFor();
  await page.screenshot({ path: `${out}/390-reduced-motion.png` });
  // Canvas screenshots should test the shader, independent of foreground UI.
  await page.addStyleTag({ content: "header > div { visibility: hidden !important; }" });
  const first = await canvas.screenshot();
  await page.waitForTimeout(600);
  assert.ok(first.equals(await canvas.screenshot()), "Reduced-motion rings must be static");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.locator('canvas[data-motion="running"]').waitFor();
  await page.waitForTimeout(500);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await canvas.waitFor();
  const stopped = await canvas.screenshot();
  await page.waitForTimeout(500);
  assert.ok(stopped.equals(await canvas.screenshot()), "Live motion preference change must stop rings");
  await context.close();
  assert.deepEqual(issues, [], "Browser console must be clean");
  await writeFile(`${out}/checks.json`, JSON.stringify({ checks, reducedMotion: "passed", issues, knownDevIssues: [...knownDevIssues] }, null, 2));
  console.log("Visual checks passed", checks);
} finally {
  if (issues.length) console.log("Browser issues", issues);
  await browser.close();
}
