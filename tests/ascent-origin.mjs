// Read-only check of the real Origin detail against an isolated production build.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.FORMAT_PLAYWRIGHT
  ? pathToFileURL(process.env.FORMAT_PLAYWRIGHT).href : 'playwright');
const browser = await chromium.launch({ headless: true,
  ...(process.env.FORMAT_CHROME ? { executablePath: process.env.FORMAT_CHROME } : {}),
});
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: width > 600 ? 900 : 844 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:4312/eventos/origin', { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => getComputedStyle(document.body).backgroundColor === 'rgb(200, 208, 210)');
    await page.waitForTimeout(1500);
    await page.waitForFunction(() => [...document.querySelectorAll('main img')]
      .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.top < innerHeight && r.bottom > 0; })
      .every(e => e.complete && e.naturalWidth > 0), {}, { timeout: 60000 });
    assert.equal(await page.locator('h1').innerText(), 'Origin');
    assert.equal(await page.locator('main').evaluate(e => getComputedStyle(e).getPropertyValue('--accent-1')), 'rgb(5, 31, 230)');
    assert.deepEqual(errors, []);
    await page.screenshot({ caret: 'initial', path: `artifacts/ascent/${width}-origin-real.png`, fullPage: true });
    console.log(width, 'Origin real: blue, styled, images loaded');
    await context.close();
  }
} finally { await browser.close(); }
