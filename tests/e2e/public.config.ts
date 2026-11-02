import { defineConfig, devices } from "@playwright/test";

// Suite pública contra un build de producción local (ver tests/README.md).
// FORMAT_QA_DIST permite buildear/servir sin pisar el .next del dev server.
const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: ".",
  testMatch: "public.spec.ts",
  outputDir: "../../test-results/public",
  fullyParallel: true,
  workers: 4,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["json", { outputFile: "../../test-results/public/results.json" }]],
  use: { baseURL: BASE_URL, acceptDownloads: true, trace: "retain-on-failure" },
  projects: [
    { name: "public-1440", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    {
      name: "public-390",
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
    {
      // 360: sólo rutas (status, consola y desborde horizontal).
      name: "public-360",
      grep: /@rutas/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true },
    },
  ],
  webServer: {
    command: `node node_modules/next/dist/bin/next start -p ${PORT} -H 127.0.0.1`,
    cwd: "../..",
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 60_000,
    env: { FORMAT_QA_DIST: process.env.FORMAT_QA_DIST ?? ".next" },
  },
});
