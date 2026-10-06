import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const { chromium } = await import(process.env.FORMAT_PLAYWRIGHT ? pathToFileURL(process.env.FORMAT_PLAYWRIGHT).href : "playwright");
const browser = await chromium.launch({ headless: true, args: ["--enable-unsafe-swiftshader"],
  ...(process.env.FORMAT_CHROME ? { executablePath: process.env.FORMAT_CHROME } : {}),
});
const url = process.env.FORMAT_PREVIEW_URL || "http://127.0.0.1:4314";
const out = "artifacts/pulse/intro"; await mkdir(out, { recursive: true });
const report = { frames: [], widths: [1440, 390, 360], errors: [], existingDevIssues: [], frameworkDiagnostics: [], durations: [] };
function observe(page) {
  page.on("pageerror", (e) => report.errors.push(e.stack || e.message));
  page.on("console", (m) => {
    if (!["error", "warning"].includes(m.type())) return;
    const text = m.text();
    // Next's dev map is keyed by URL: the footer's duplicate logo overwrites
    // the hero's priority flag. The actual hero preload is asserted below.
    if (text.startsWith('Image with src "/logos/logo-format-horizontal.svg" was detected as the Largest Contentful Paint')) {
      report.frameworkDiagnostics.push(text); return;
    }
    const known = (text.includes("va.vercel-scripts.com") && text.includes("Content Security Policy"))
      || text.startsWith("You have Reduced Motion enabled on your device.");
    (known ? report.existingDevIssues : report.errors).push(text);
  });
}
async function context(width, reduced = false, controlled = true) {
  const ctx = await browser.newContext({ viewport: { width, height: width === 1440 ? 900 : 844 }, reducedMotion: reduced ? "reduce" : "no-preference" });
  await ctx.addInitScript(({ controlled }) => {
    // Same Motion sequence using its JS driver, so virtual-clock frames are exact.
    // Native WAAPI is checked separately below, with no browser API overrides.
    if (controlled) Element.prototype.animate = undefined;
    const show = HTMLDialogElement.prototype.showModal;
    const close = HTMLDialogElement.prototype.close;
    window.introTiming = {};
    HTMLDialogElement.prototype.showModal = function() {
      if (this.hasAttribute("data-pulse-intro")) window.introTiming.start = Date.now();
      return show.call(this);
    };
    HTMLDialogElement.prototype.close = function() {
      if (this.open && this.hasAttribute("data-pulse-intro")) window.introTiming.end = Date.now();
      return close.call(this);
    };
    HTMLMediaElement.prototype.play = () => Promise.resolve();
  }, { controlled });
  const page = await ctx.newPage(); observe(page);
  if (controlled) {
    await page.clock.install();
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 20));
  }
  await page.goto(url, { waitUntil: "load", timeout: 90000 });
  await page.evaluate(() => { const style = document.createElement("style"); style.textContent = "nextjs-portal { display: none !important; }"; document.head.append(style); });
  await page.locator("dialog[data-pulse-intro][open]").waitFor({ state: "attached", timeout: 60000 });
  return { ctx, page };
}
async function frame(page, ms, name) {
  const elapsed = await page.evaluate(() => Date.now() - window.introTiming.start);
  if (ms > elapsed) await page.clock.runFor(ms - elapsed);
  const path = `${out}/${name}.png`; await page.screenshot({ path }); report.frames.push(path);
}
async function validateGeometry(page) {
  const geometry = await page.locator("[data-ring-position] svg").evaluate((svg) => {
    const outer = svg.querySelector("[data-outer]"), inner = svg.querySelector("[data-inner]");
    const rect = svg.getBoundingClientRect();
    return { outer: +outer.getAttribute("r"), inner: +inner.getAttribute("r"),
      outerCenter: [outer.getAttribute("cx"), outer.getAttribute("cy")],
      innerCenter: [inner.getAttribute("cx"), inner.getAttribute("cy")],
      ratio: rect.width / rect.height, width: rect.width, viewport: innerWidth,
      stroke: getComputedStyle(outer).strokeWidth, innerStroke: getComputedStyle(inner).strokeWidth };
  });
  assert.equal(geometry.inner, geometry.outer * .92);
  assert.deepEqual(geometry.outerCenter, geometry.innerCenter);
  assert.equal(geometry.stroke, geometry.innerStroke);
  assert.ok(Math.abs(geometry.ratio - 1) < .001);
  assert.ok(geometry.width <= geometry.viewport * .7 + 1);
}

try {
  for (const width of report.widths) {
    console.log("Intro frames", width);
    const { ctx, page } = await context(width);
    await validateGeometry(page);
    for (const ms of [300, 1100, 1800, 2700]) {
      await frame(page, ms, `${width}-${ms}ms`);
      if (ms === 300) {
        const strokes = await page.locator("[data-outer], [data-inner]").evaluateAll((circles) => circles.map((e) => ({
          remaining: parseFloat(getComputedStyle(e).strokeDashoffset) / (2 * Math.PI * +e.getAttribute("r")),
          reflection: e.parentElement.getAttribute("transform"),
        })));
        assert.ok(strokes[0].remaining > 0 && strokes[0].remaining < 1);
        assert.ok(Math.abs(strokes[0].remaining - strokes[1].remaining) < .0001, "Both strokes must draw at the same rate");
        assert.equal(strokes[1].reflection, "translate(100 0) scale(-1 1)", "Inner winding must be reversed");
      }
      if (ms === 1800) {
        assert.equal(await page.locator("#season-welcome").innerText(), "WELCOME TO PULSE");
        assert.equal(await page.locator("[data-secondary]").innerText(), "FEEL THE CONNECTION");
        assert.ok(await page.locator('link[rel="preload"][as="image"][href="/logos/logo-format-horizontal.svg"]').count(), "Hero logo is already preloaded");
        for (const selector of ["[data-primary]", "[data-secondary]"]) {
          assert.ok(await page.locator(selector).evaluate((e) => {
            const r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && +getComputedStyle(e).opacity > .98;
          }), "Tape must be visible and fit the viewport");
        }
        assert.ok(await page.locator("[data-primary]").evaluate((e) => parseFloat(getComputedStyle(e).fontSize) >= 19
          && +getComputedStyle(e).fontWeight >= 700), "Red tape meets the large-text contrast threshold");
      }
    }
    // Hero starts behind the entrance, before the iris completes.
    assert.ok(await page.locator("canvas").evaluate((e) => e.width > 1 && e.dataset.motion !== undefined));
    await page.clock.runFor(400);
    await page.locator("dialog[open]").waitFor({ state: "hidden" });
    assert.equal(await page.locator("[data-home-content]").evaluate((e) => e.style.clipPath), "");
    assert.equal(await page.locator("body").evaluate((e) => e.style.overflow), "");
    await page.reload({ waitUntil: "load" });
    await page.clock.runFor(100);
    assert.equal(await page.locator("dialog[open]").count(), 0, "Same session must not repeat");
    await ctx.close();

    const reduced = await context(width, true);
    await validateGeometry(reduced.page);
    assert.equal(await reduced.page.locator("[data-flash]").count(), 0);
    await frame(reduced.page, 500, `${width}-reduced-motion`);
    assert.equal(await reduced.page.locator("[data-ring-stage]").evaluate((e) => getComputedStyle(e).transform), "none");
    await reduced.page.clock.runFor(600);
    await reduced.page.locator("dialog[open]").waitFor({ state: "hidden" });
    await reduced.ctx.close();
  }

  for (const gesture of ["click", "Space", "a", "Escape", "Tab"]) {
    const { ctx, page } = await context(390);
    await page.clock.runFor(300);
    if (gesture === "click") await page.mouse.click(24, 24); else await page.keyboard.press(gesture);
    await page.clock.runFor(700);
    assert.equal(await page.locator("dialog[open]").count(), 0, `Skip with ${gesture}`);
    assert.equal(await page.locator("[data-home-content]").evaluate((e) => e.style.clipPath), "");
    await ctx.close();
  }

  for (const reduced of [false, true]) {
    const { ctx, page } = await context(390, reduced, false);
    await page.locator("dialog[open]").waitFor({ state: "hidden", timeout: 15000 });
    const duration = await page.evaluate(() => window.introTiming.end - window.introTiming.start);
    report.durations.push({ reduced, duration });
    assert.ok(duration >= (reduced ? 950 : 2900) && duration < (reduced ? 1300 : 3500), `Native duration ${duration}`);
    assert.equal(await page.locator("body").evaluate((e) => getComputedStyle(e).visibility), "visible");
    await ctx.close();
  }
  report.existingDevIssues = [...new Set(report.existingDevIssues)];
  report.frameworkDiagnostics = [...new Set(report.frameworkDiagnostics)];
  await writeFile(`${out}/checks.json`, JSON.stringify(report, null, 2));
  assert.deepEqual(report.errors, []);
  console.log("Pulse intro frames, persistence, skips and reduced motion passed", report.durations);
} finally { if (report.errors.length) console.log(report.errors); await browser.close(); }
