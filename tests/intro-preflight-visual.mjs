import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const { chromium } = await import(process.env.FORMAT_PLAYWRIGHT
  ? pathToFileURL(process.env.FORMAT_PLAYWRIGHT).href : "playwright");
const browser = await chromium.launch({
  headless: true,
  ...(process.env.FORMAT_CHROME ? { executablePath: process.env.FORMAT_CHROME } : {}),
});
const url = "http://127.0.0.1:4310";
const key = "format:visit-intro:v2:ascent:2020-09-04";
await mkdir("artifacts/ascent", { recursive: true });

try {
  // Sin bundles de hidratación, el documento queda deliberadamente tapado:
  // comprueba que la home no puede pintar antes de que React abra el modal.
  const preflight = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const early = await preflight.newPage();
  await early.route("**/_next/static/chunks/**/*.js", route => route.abort());
  await early.goto(url, { waitUntil: "domcontentloaded" });
  await early.waitForFunction(() => document.documentElement.hasAttribute("data-intro-preflight"));
  assert.equal(await early.locator("body").evaluate(e => getComputedStyle(e).visibility), "hidden");
  await early.screenshot({ path: "artifacts/ascent/1440-intro-preflight.png" });
  await preflight.close();

  // Primera visita real: el primer contenido visible es el diálogo de intro.
  const first = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await first.addInitScript(() => {
    let calls = 0;
    Object.defineProperty(window, "__formatPlayCalls", { get: () => calls });
    HTMLMediaElement.prototype.play = function () { calls += 1; return Promise.resolve(); };
  });
  const page = await first.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.locator("dialog[open]").waitFor();
  assert.equal(await page.locator("html").evaluate(e => e.hasAttribute("data-intro-preflight")), false);
  const enter = page.getByRole("button", { name: /tap to enter/i });
  await enter.waitFor();
  await page.screenshot({ path: "artifacts/ascent/1440-intro-entry.png" });
  await enter.click();
  await page.locator("h2#season-welcome").waitFor({ state: "attached" });
  assert.ok(await page.evaluate(() => window.__formatPlayCalls > 0));
  await page.evaluate(() => {
    document.querySelector("dialog")?.getAnimations({ subtree: true }).forEach(animation => {
      animation.pause();
      animation.currentTime = 1100;
    });
  });
  const originCaption = page.getByText("001 — ORIGIN", { exact: true });
  await originCaption.waitFor();
  assert.notEqual(await originCaption.evaluate(e => getComputedStyle(e).opacity), "0");
  await page.screenshot({ path: "artifacts/ascent/1440-intro-origin-complete.png" });
  assert.deepEqual(errors, []);
  await first.close();

  // El rótulo conserva la jerarquía de cinta sin desbordar en mobile.
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(url, { waitUntil: "domcontentloaded" });
  await mobilePage.locator("dialog[open]").waitFor();
  await mobilePage.getByRole("button", { name: /tap to enter/i }).click();
  await mobilePage.locator("h2#season-welcome").waitFor({ state: "attached" });
  await mobilePage.evaluate(() => {
    document.querySelector("dialog")?.getAnimations({ subtree: true }).forEach(animation => {
      animation.pause();
      animation.currentTime = 1100;
    });
  });
  const mobileCaption = mobilePage.locator("p[class*='originComplete'] > span");
  await mobileCaption.waitFor();
  assert.ok(await mobileCaption.evaluate(e => e.getBoundingClientRect().width <= window.innerWidth));
  await mobilePage.screenshot({ path: "artifacts/ascent/390-intro-origin-complete.png" });
  await mobile.close();

  // Visita recordada: no se aplica la ocultación previa y no aparece modal.
  const repeat = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await repeat.addInitScript(storedKey => sessionStorage.setItem(storedKey, "1"), key);
  const repeated = await repeat.newPage();
  await repeated.goto(url, { waitUntil: "domcontentloaded" });
  await repeated.waitForTimeout(600);
  assert.equal(await repeated.locator("html").evaluate(e => e.hasAttribute("data-intro-preflight")), false);
  assert.equal(await repeated.locator("dialog[open]").count(), 0);
  assert.equal(await repeated.locator("body").evaluate(e => getComputedStyle(e).visibility), "visible");
  await repeat.close();

  const reduced = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const reducedPage = await reduced.newPage();
  await reducedPage.goto(url, { waitUntil: "domcontentloaded" });
  await reducedPage.waitForTimeout(600);
  assert.equal(await reducedPage.locator("html").evaluate(e => e.hasAttribute("data-intro-preflight")), false);
  assert.equal(await reducedPage.locator("dialog[open]").count(), 0);
  await reduced.close();
  console.log("Preflight, repeated visit, reduced motion and Origin caption passed.");
} finally {
  await browser.close();
}
