import { defineConfig, devices } from "@playwright/test";
import { readStackEnv } from "./stack-env";

// Suite de admin contra el Supabase LOCAL (ver tests/README.md). Serial y con
// un solo worker: los casos comparten sesión y datos de prueba.
const PORT = 3200;
const env = readStackEnv();

export default defineConfig({
  testDir: ".",
  testMatch: "admin.spec.ts",
  outputDir: "../../test-results/admin",
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["json", { outputFile: "../../test-results/admin/results.json" }]],
  use: {
    ...devices["Desktop Chrome"],
    // Con -H 127.0.0.1 los redirects del middleware salen a localhost.
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1440, height: 900 },
    // El CSP sólo permite el host de Supabase de producción; acá las
    // imágenes vienen del stack local.
    bypassCSP: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `node node_modules/next/dist/bin/next start -p ${PORT} -H 127.0.0.1`,
    cwd: "../..",
    url: `http://127.0.0.1:${PORT}/admin/login`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      FORMAT_QA_DIST: ".next-qa-admin",
      NEXT_PUBLIC_SUPABASE_URL: env.API_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: env.ANON_KEY,
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "",
    },
  },
});
