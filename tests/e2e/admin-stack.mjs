// Supabase LOCAL aislado para la suite de admin (proyecto "format-qa",
// puertos 553xx). Nunca toca producción. Ver tests/README.md.
// La ubicación del stack y la lectura del env replican tests/e2e/stack-env.ts.
//
//   node tests/e2e/admin-stack.mjs up     levanta el stack desde cero con las migraciones del repo
//   node tests/e2e/admin-stack.mjs build  buildea la app contra el stack en .next-qa-admin
//   node tests/e2e/admin-stack.mjs down   apaga el stack y borra sus datos
import { execSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const STACK_DIR = process.env.FORMAT_QA_SUPABASE_DIR ?? join(tmpdir(), "format-qa-supabase");
const ENV_FILE = join(STACK_DIR, "local-sb.env");

const run = (cmd, opts = {}) => execSync(cmd, { cwd: STACK_DIR, stdio: "inherit", ...opts });

function readStackEnv() {
  if (!existsSync(ENV_FILE)) throw new Error(`Falta ${ENV_FILE}: corré "node tests/e2e/admin-stack.mjs up".`);
  const env = Object.fromEntries(readFileSync(ENV_FILE, "utf8").trim().split(/\r?\n/)
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")]));
  if (env.API_URL !== "http://127.0.0.1:55321") throw new Error(`API_URL inesperada (${env.API_URL}): sólo Supabase local.`);
  return env;
}

function up() {
  mkdirSync(join(STACK_DIR, "supabase"), { recursive: true });
  // Si quedó uno corriendo, se apaga sin backup: cada corrida arranca limpia.
  try { run("supabase stop --no-backup", { stdio: "ignore" }); } catch { /* No estaba corriendo. */ }
  copyFileSync(join(REPO, "tests/e2e/supabase-qa/config.toml"), join(STACK_DIR, "supabase/config.toml"));
  const migrations = join(STACK_DIR, "supabase/migrations");
  rmSync(migrations, { recursive: true, force: true });
  mkdirSync(migrations);
  // 0001_init.sql → 20260101000001_init.sql (el CLI exige timestamp).
  for (const file of readdirSync(join(REPO, "supabase/migrations")).filter((f) => /^\d{4}_.+\.sql$/.test(f)).sort()) {
    copyFileSync(join(REPO, "supabase/migrations", file), join(migrations, `2026010100${file.slice(0, 4)}${file.slice(4)}`));
  }
  run("supabase start");
  const env = execSync("supabase status -o env", { cwd: STACK_DIR, encoding: "utf8" });
  writeFileSync(ENV_FILE, env.split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).join("\n") + "\n");
  readStackEnv();
  console.log(`\nStack listo. Env en ${ENV_FILE}`);
}

function build() {
  const env = readStackEnv();
  // El build agrega .next-qa-admin/types al include de tsconfig.json: se restaura.
  const tsconfig = readFileSync(join(REPO, "tsconfig.json"));
  try {
    execSync("npm run build", {
      cwd: REPO,
      stdio: "inherit",
      env: {
        ...process.env,
        FORMAT_QA_DIST: ".next-qa-admin",
        NEXT_PUBLIC_SUPABASE_URL: env.API_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: env.ANON_KEY,
        // Captcha apagado en el stack local.
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: "",
      },
    });
  } finally {
    writeFileSync(join(REPO, "tsconfig.json"), tsconfig);
  }
}

function down() {
  run("supabase stop --no-backup");
}

const command = process.argv[2];
if (fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? "")) {
  if (command === "up") up();
  else if (command === "build") build();
  else if (command === "down") down();
  else {
    console.error("Uso: node tests/e2e/admin-stack.mjs up|build|down");
    process.exit(1);
  }
}
