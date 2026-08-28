import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
const source = await readFile(new URL("../lib/calendar.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
const { fridaysOf, pastFridaysOf } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
test("calendar includes Fridays only, including months with five", () => {
  assert.deepEqual(fridaysOf(2026,8), ["2026-08-07","2026-08-14","2026-08-21","2026-08-28"]);
  assert.equal(fridaysOf(2026,5).length, 5);
  for (const day of fridaysOf(2026,5)) assert.equal(new Date(`${day}T12:00:00Z`).getUTCDay(),5);
});
test("today and future Fridays never appear as empty past slots", () => {
  assert.deepEqual(pastFridaysOf(2026,8,"2026-08-28"), ["2026-08-07","2026-08-14","2026-08-21"]);
  assert.deepEqual(pastFridaysOf(2026,9,"2026-08-28"), []);
});
