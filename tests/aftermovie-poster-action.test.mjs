import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../app/admin/(protected)/seasons/actions.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const actionResult = ts.transpileModule(
  await readFile(new URL("../lib/admin/action-result.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
const id = "11111111-1111-4111-8111-111111111111";
const path = `${id}/aftermovie-22222222-2222-4222-8222-222222222222.webp`;

const load = (code, require) => {
  const exports = {};
  new Function("require", "exports", code)(require, exports);
  return exports;
};

function setup({ role = "admin", info = { contentType: "image/webp" }, readError = null, writeError = null, rows = 1 } = {}) {
  const writes = [], invalidations = [];
  const client = {
    auth: { getUser: async () => ({ data: { user: { app_metadata: { role } } } }) },
    storage: { from: () => ({ info: async () => ({ data: info }) }) },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: { slug: "ascent" }, error: readError }) }) }),
      update: payload => ({ eq: () => ({ select: async () => {
        if (!writeError && rows > 0) writes.push(payload);
        return { data: writeError ? null : Array.from({ length: rows }, () => ({ id })), error: writeError };
      } }) }),
    }),
  };
  // Mismo contrato que lib/auth/admin-action.ts + requireAdmin: sin rol admin
  // redirige (Next lo implementa tirando NEXT_REDIRECT).
  const adminAction = fn => async (...args) => {
    const { data: { user } } = await client.auth.getUser();
    if (user?.app_metadata?.role !== "admin") throw new Error("NEXT_REDIRECT /admin/login?error=sin-permisos");
    return fn({ supabase: client, user }, ...args);
  };
  const exports = load(outputText, name => {
    if (name === "next/cache") return { revalidatePath: p => invalidations.push(p) };
    if (name === "@/lib/auth/admin-action") return { adminAction };
    if (name === "@/lib/admin/action-result") return load(actionResult, () => ({}));
    return {};
  });
  return { save: (filePath = path) => exports.attachAftermoviePoster(id, filePath), writes, invalidations };
}

test("poster upload accepts current Storage info contentType and legacy metadata", async () => {
  for (const info of [{ contentType: "image/webp" }, { metadata: { mimetype: "image/webp" } }]) {
    const action = setup({ info });
    assert.deepEqual(await action.save(), { ok: true });
    assert.deepEqual(action.writes, [{ aftermovie_poster_path: path }]);
    assert.ok(action.invalidations.includes("/"));
    assert.ok(action.invalidations.includes("/admin"));
  }
});

test("poster upload redirects users without the admin role before touching anything", async () => {
  const action = setup({ role: "viewer" });
  await assert.rejects(() => action.save(), /NEXT_REDIRECT/);
  assert.deepEqual(action.writes, []);
  assert.deepEqual(action.invalidations, []);
});

test("poster upload rejects foreign paths and invalid media with a visible error", async () => {
  for (const [options, filePath] of [
    [{}, `another-season/${path}`],
    [{ info: { contentType: "image/png" } }, path],
    [{ info: null }, path],
  ]) {
    const action = setup(options);
    const result = await action.save(filePath);
    assert.equal(result.ok, false);
    assert.ok(result.error);
    assert.deepEqual(action.writes, []);
    assert.deepEqual(action.invalidations, []);
  }
});

test("missing migration, failed writes and zero affected rows surface errors without invalidation", async () => {
  for (const options of [{ readError: new Error("missing column") }, { writeError: new Error("denied") }, { rows: 0 }]) {
    const action = setup(options);
    const result = await action.save();
    assert.equal(result.ok, false);
    assert.ok(result.error);
    assert.deepEqual(action.writes, []);
    assert.deepEqual(action.invalidations, []);
  }
});
