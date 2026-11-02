import { existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Misma ubicación que usa tests/e2e/admin-stack.mjs.
export const STACK_DIR = process.env.FORMAT_QA_SUPABASE_DIR ?? join(tmpdir(), "format-qa-supabase");
export const ENV_FILE = join(STACK_DIR, "local-sb.env");

/** Env del Supabase LOCAL; falla si apunta a cualquier otra cosa. */
export function readStackEnv(): Record<string, string> {
  if (!existsSync(ENV_FILE)) throw new Error(`Falta ${ENV_FILE}: corré "node tests/e2e/admin-stack.mjs up".`);
  const env = Object.fromEntries(readFileSync(ENV_FILE, "utf8").trim().split(/\r?\n/)
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")]));
  if (env.API_URL !== "http://127.0.0.1:55321") throw new Error(`API_URL inesperada (${env.API_URL}): sólo Supabase local.`);
  return env;
}
