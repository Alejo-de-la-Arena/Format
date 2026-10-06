import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
const { chromium } = await import(process.env.FORMAT_PLAYWRIGHT ? pathToFileURL(process.env.FORMAT_PLAYWRIGHT).href : "playwright");
const browser = await chromium.launch({ headless: true, args: ["--enable-unsafe-swiftshader"],
  ...(process.env.FORMAT_CHROME ? { executablePath: process.env.FORMAT_CHROME } : {}),
});
const out = "artifacts/pulse/hero"; await mkdir(out, { recursive: true });
const errors = [];
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: width > 600 ? 900 : 844 } });
    await context.addInitScript(() => {
      sessionStorage.setItem("format:visit-intro:v2:pulse:2026-10-09", "1");
      window.qaTime = .84;
      for (const proto of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
        const names = new WeakMap(); const get = proto.getUniformLocation; const set = proto.uniform1f;
        proto.getUniformLocation = function(program, name) { const loc = get.call(this, program, name); if (loc) names.set(loc, name); return loc; };
        proto.uniform1f = function(loc, value) { return set.call(this, loc, names.get(loc) === "uTime" ? window.qaTime : value); };
      }
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "warning" || m.type() === "error") {
      if (!(m.text().includes("va.vercel-scripts.com") && m.text().includes("Content Security Policy"))) errors.push(m.text());
    } });
    await page.goto(process.env.FORMAT_PREVIEW_URL || "http://127.0.0.1:4314", { waitUntil: "load", timeout: 90000 });
    await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
    const canvas = page.locator("canvas"); await page.locator('canvas[data-motion="running"]').waitFor({ timeout: 60000 });
    for (let mode = 0; mode < 8; mode++) {
      await page.evaluate((time) => { window.qaTime = time; }, (mode + .3) * 2.8);
      await page.waitForTimeout(150);
      await page.screenshot({ path: `${out}/${width}-mode-${mode + 1}.png` });
    }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.emulateMedia({ reducedMotion: "reduce" }); await page.locator('canvas[data-motion="paused"]').waitFor();
    await page.addStyleTag({ content: "header > div { visibility: hidden !important; }" });
    const first = await canvas.screenshot(); await page.waitForTimeout(300);
    assert.ok(first.equals(await canvas.screenshot()));
    await context.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(`${out}/checks.json`, JSON.stringify({ modes: 8, widths: [1440, 390], adaptedModes: [1, 3, 4, 5, 7], reducedMotion: "passed", errors }, null, 2));
  console.log("Eight hero modes passed");
} finally { if (errors.length) console.log(errors); await browser.close(); }
