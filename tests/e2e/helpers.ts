import { expect, test, type Page } from "@playwright/test";

/** Terceros que loguean por su cuenta (embeds, analytics, captcha) y avisos
 * de rendimiento del driver GL por software del Chromium headless. */
const THIRD_PARTY = /youtube|ytimg|google|doubleclick|vercel-scripts|_vercel\/(insights|speed-insights)|challenges\.cloudflare|GL Driver Message \(OpenGL, Performance/i;

/**
 * Avisos conocidos que ya están en main y no bloquean: no cuentan como fallo,
 * pero quedan anotados en el reporte del test para no perderlos de vista.
 * - Chrome avisa cuando el CSS que precarga el prefetch de un <Link> (p. ej.
 *   /about o /experience desde el nav) no se usa a los pocos segundos.
 */
const KNOWN = [/was preloaded using link preload but not used within a few seconds/];

/** Junta errores/warnings de consola, excepciones y 4xx/5xx del propio sitio. */
export function watchIssues(page: Page, origin?: string): string[] {
  const issues: string[] = [];
  page.on("pageerror", (e) => issues.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if ((m.type() !== "error" && m.type() !== "warning") || THIRD_PARTY.test(m.text())) return;
    const text = `${m.type()}: ${m.text().slice(0, 200)}`;
    if (KNOWN.some((re) => re.test(m.text()))) {
      try {
        test.info().annotations.push({ type: "aviso conocido", description: text });
      } catch {
        // El test ya terminó: el aviso llegó tarde y no afecta el resultado.
      }
    } else {
      issues.push(text);
    }
  });
  if (origin) {
    page.on("response", (r) => {
      if (r.status() >= 400 && r.url().startsWith(origin)) issues.push(`HTTP ${r.status()} ${r.url()}`);
    });
  }
  return issues;
}

export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "desborde horizontal (px)").toBeLessThanOrEqual(0);
}

/** RIFF....WEBP */
export function isWebp(buf: Buffer): boolean {
  return buf.length > 12 && buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP";
}
