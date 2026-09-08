import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

// Point FORMAT_PLAYWRIGHT at an installed Playwright module when not in node_modules.
const { chromium } = await import(process.env.FORMAT_PLAYWRIGHT
  ? pathToFileURL(process.env.FORMAT_PLAYWRIGHT).href : 'playwright');
const browser = await chromium.launch({ headless: true,
  ...(process.env.FORMAT_CHROME ? { executablePath: process.env.FORMAT_CHROME } : {}),
});
const out = 'artifacts/ascent';
await mkdir(out, { recursive: true });
const errors = [];
const results = [];
try {
  for (const width of [1440, 390, 360]) {
    const context = await browser.newContext({ viewport: { width, height: width > 600 ? 900 : 844 } });
    const page = await context.newPage(); page.setDefaultNavigationTimeout(60000); console.log('Viewport', width);
    page.on('response', r => { if (r.status() >= 400) console.log('HTTP', r.status(), r.url()); });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', msg => { if (['warning', 'error'].includes(msg.type())) errors.push(msg.text()); });
    await page.goto('http://127.0.0.1:4310', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    await page.waitForFunction(() => !document.querySelector('dialog[open]'));
    // New tab provides the same first-visit behavior without touching persistence.
    const introContext = await browser.newContext({ viewport: { width, height: width > 600 ? 900 : 844 } });
    const intro = await introContext.newPage();
    await intro.clock.install();
    await intro.goto('http://127.0.0.1:4310', { waitUntil: 'domcontentloaded' });
    await intro.locator('dialog[open]').waitFor();
    await intro.clock.pauseAt(await intro.evaluate(() => Date.now() + 200));
    // Freeze the actual CSS animations at deterministic frames of their timeline.
    for (const [name, time] of [['01-origin', 400], ['02-transition', 1050], ['03-ascent', 2100]]) {
      await intro.evaluate(time => {
        document.querySelector('dialog').getAnimations({ subtree: true }).forEach(a => { a.pause(); a.currentTime = time; });
      }, time);
      await intro.screenshot({ caret: 'initial', path: `${out}/${width}-intro-${name}.png` });
    }
    await introContext.close();
    await page.bringToFront();
    await page.screenshot({ caret: 'initial', path: `${out}/${width}-hero.png` });
    const header = page.locator('nav').first();
    await header.screenshot({ caret: 'initial', path: `${out}/${width}-header.png` });
    assert.equal(await page.locator('body').evaluate(e => getComputedStyle(e).getPropertyValue('--accent-1').trim().toLowerCase()), 'rgb(123, 63, 228)');
    const section = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Qué es FORMAT', exact: true }) });
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(450);
    await section.screenshot({ caret: 'initial', path: `${out}/${width}-about.png` });
    assert.match(await section.innerText(), /002 Ascent/i);
    const html = await page.content();
    assert.doesNotMatch(html, /Jungle|Eclipse|#16A34A|#F5B324/i);
    await page.locator('footer').scrollIntoViewIfNeeded();
    assert.equal(await page.locator('footer > div').first().evaluate(e => getComputedStyle(e).backgroundColor), 'rgb(123, 63, 228)');
    await page.locator('footer').screenshot({ caret: 'initial', path: `${out}/${width}-footer.png` });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
    if (width < 768) {
      await page.getByRole('button', { name: 'Abrir menú' }).click();
      await page.getByRole('dialog', { name: 'Menú' }).waitFor();
      await page.waitForTimeout(700);
      await page.screenshot({ caret: 'initial', path: `${out}/${width}-menu.png` });
      await page.keyboard.press('Escape');
    }
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    assert.equal(await page.locator('dialog[open]').count(), 0, 'Same session must not replay intro');
    await page.goto('http://127.0.0.1:4310/eventos/origin', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => [...document.querySelectorAll('main [style]')].every(e => e.style.opacity !== '0'));
    await page.waitForTimeout(500);
    assert.equal(await page.locator('main').evaluate(e => getComputedStyle(e).getPropertyValue('--accent-1').trim().toLowerCase()), 'rgb(30, 56, 245)');
    assert.equal(await page.locator('nav').first().evaluate(e => getComputedStyle(e).getPropertyValue('--header-accent').trim().toLowerCase()), '#1e38f5');
    await page.screenshot({ caret: 'initial', path: `${out}/${width}-origin.png` });
    results.push({ width, theme: 'Ascent', detail: 'Origin blue', overflow: false, hiddenSeasons: 'absent', persistence: 'passed' });
    await context.close();
  }
  const reduced = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
  const page = await reduced.newPage();
  await page.goto('http://127.0.0.1:4310', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  assert.equal(await page.locator('dialog[open]').count(), 0);
  await page.locator('canvas[data-motion="paused"]').waitFor();
  await reduced.close();
  assert.deepEqual(errors, [], 'Browser console must be clean');
  await writeFile(`${out}/checks.json`, JSON.stringify({ results, reducedMotion: 'passed', errors }, null, 2));
  console.log('Visual checks passed:', results);
} finally { if (errors.length) console.log('Browser errors:', errors); await browser.close(); }
