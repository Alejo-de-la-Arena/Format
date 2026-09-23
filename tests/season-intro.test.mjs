import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

// No extra runner dependency; transpile the pure production module in memory.
const source = await readFile(new URL("../lib/season-intro.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
const { buenosAiresDay, getIntroSeasons, introStorageKey, isIntroMotion, isIntroText, shouldAutoIntro } =
  await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

const season = (slug, fechaInicio, fechaFin = fechaInicio) => ({ slug, fechaInicio, fechaFin, nombre: slug });
test("Buenos Aires midnight, independent of server timezone", () => {
  assert.equal(buenosAiresDay(new Date("2026-09-01T02:59:59Z")), "2026-08-31");
  assert.equal(buenosAiresDay(new Date("2026-09-01T03:00:00Z")), "2026-09-01");
});
test("active identity matches theme: current, next in gaps, last after ending", () => {
  const a = season("one", "2026-08-01", "2026-08-28"), b = season("two", "2026-09-04", "2026-09-25"), c = season("three", "2026-10-02");
  const rows = [c, a, b];
  assert.deepEqual(getIntroSeasons(rows, "2026-08-14"), { current: a, previous: null });
  assert.deepEqual(getIntroSeasons(rows, "2026-08-31"), { current: b, previous: a });
  assert.deepEqual(getIntroSeasons(rows, "2026-09-04"), { current: b, previous: a });
  assert.deepEqual(getIntroSeasons(rows, "2027-01-01"), { current: c, previous: b });
  assert.deepEqual(rows, [c, a, b]);
});
test("empty is neutral; pre-launch uses the upcoming identity without a previous one", () => {
  assert.deepEqual(getIntroSeasons([], "2026-08-01"), { current: null, previous: null });
  const upcoming = season("later", "2026-09-01");
  assert.deepEqual(getIntroSeasons([upcoming], "2026-08-01"), { current: upcoming, previous: null });
});
test("welcome starts once per visit, except reduced motion or history return", () => {
  const first = { seen: false, reduced: false, returning: false };
  assert.equal(shouldAutoIntro(first), true);
  for (const override of [{ seen: true }, { reduced: true }, { returning: true }]) {
    assert.equal(shouldAutoIntro({ ...first, ...override }), false);
  }
});
test("remember each Season separately without including editorial content", () => {
  assert.notEqual(introStorageKey(season("one", "2026-08-01")), introStorageKey(season("two", "2026-09-01")));
  assert.equal(introStorageKey(season("one", "2026-08-01")), "format:visit-intro:v2:one:2026-08-01");
});
test("motion preset validation", () => {
  for (const preset of ["signal", "ascend", "expand"]) assert.equal(isIntroMotion(preset), true);
  assert.equal(isIntroMotion("untrusted"), false);
  assert.equal(isIntroMotion(undefined), false);
});
test("welcome text validation keeps the cinematic card readable", () => {
  assert.equal(isIntroText("A\r\nB\r\nC"), true);
  assert.equal(isIntroText("x".repeat(160)), true);
  assert.equal(isIntroText("x".repeat(161)), false);
  assert.equal(isIntroText("A\nB\nC\nD"), false);
});
