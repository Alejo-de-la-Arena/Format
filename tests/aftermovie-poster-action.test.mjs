import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../app/admin/(protected)/seasons/actions.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const id = "11111111-1111-4111-8111-111111111111";
const path = `${id}/aftermovie-22222222-2222-4222-8222-222222222222.webp`;

function setup({ role = "admin", info = { contentType: "image/webp" }, readError = null, writeError = null } = {}) {
  const writes = [], invalidations = [];
  const client = {
    auth: { getUser: async () => ({ data: { user: { app_metadata: { role } } } }) },
    storage: { from: () => ({ info: async () => ({ data: info }) }) },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: { slug: "ascent" }, error: readError }) }) }),
      update: payload => ({ eq: () => ({ select: () => ({ single: async () => {
        if (!writeError) writes.push(payload);
        return { data: writeError ? null : { id }, error: writeError };
      } }) }) }),
    }),
  };
  const exports = {};
  new Function("require", "exports", outputText)(name => {
    if (name === "next/cache") return { revalidatePath: p => invalidations.push(p) };
    if (name === "@/lib/supabase/server") return { createClient: async () => client };
    return {};
  }, exports);
  return { save: (filePath = path) => exports.attachAftermoviePoster(id, filePath), writes, invalidations };
}

test("poster upload accepts current Storage info contentType and legacy metadata", async () => {
  for (const info of [{ contentType: "image/webp" }, { metadata: { mimetype: "image/webp" } }]) {
    const action = setup({ info });
    await action.save();
    assert.deepEqual(action.writes, [{ aftermovie_poster_path: path }]);
    assert.ok(action.invalidations.includes("/"));
    assert.ok(action.invalidations.includes("/admin"));
  }
});

test("poster upload rejects unauthorized users, foreign paths and invalid media", async () => {
  for (const [options, filePath] of [
    [{ role: "viewer" }, path],
    [{}, `another-season/${path}`],
    [{ info: { contentType: "image/png" } }, path],
    [{ info: null }, path],
  ]) {
    const action = setup(options);
    await assert.rejects(() => action.save(filePath));
    assert.deepEqual(action.writes, []);
    assert.deepEqual(action.invalidations, []);
  }
});

test("missing migration and failed writes surface errors without invalidation", async () => {
  for (const options of [{ readError: new Error("missing column") }, { writeError: new Error("denied") }]) {
    const action = setup(options);
    await assert.rejects(() => action.save());
    assert.deepEqual(action.writes, []);
    assert.deepEqual(action.invalidations, []);
  }
});