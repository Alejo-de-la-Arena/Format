import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

// Pure production modules only: no database, HTTP requests or SQL execution.
async function moduleUrl(file) {
  const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
  let { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  });
  for (const match of outputText.matchAll(/from "@\/(.*?)"/g)) {
    outputText = outputText.replace(match[0], `from "${await moduleUrl(`${match[1]}.ts`)}"`);
  }
  return `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
}

const { PULSE, PULSE_FECHAS, getDevSeasonOverride } = await import(await moduleUrl("lib/season-pulse.ts"));
const { normalizeForma } = await import(await moduleUrl("lib/season-shape.ts"));
const { SHAPE_PATHS, getShapePath } = await import(await moduleUrl("components/shapePaths.ts"));
const { getIntroSeasons } = await import(await moduleUrl("lib/season-intro.ts"));

test("Pulse becomes active in the October gap without changing Ascent's identity", () => {
  const previous = { slug: "ascent", numero: "002", forma: "triangle", colores: ["#7B3FE4"],
    fechaInicio: "2026-09-11", fechaFin: "2026-10-02" };
  assert.equal(getIntroSeasons([previous, PULSE], "2026-10-05").current, PULSE);
  assert.equal(getIntroSeasons([previous, PULSE], "2026-09-25").current, previous);
  assert.equal(previous.forma, "triangle");
  assert.deepEqual(previous.colores, ["#7B3FE4"]);
  assert.deepEqual(PULSE_FECHAS.map((f) => [f.fecha, f.especial]), [
    ["2026-10-09", true], ["2026-10-16", false], ["2026-10-23", false], ["2026-10-30", false],
  ]);
});

test("the Pulse override supports local production builds but never Vercel production", () => {
  const original = { nodeEnv: process.env.NODE_ENV, vercelEnv: process.env.VERCEL_ENV, override: process.env.NEXT_PUBLIC_SEASON_OVERRIDE };
  try {
    for (const nodeEnv of ["production", "test", "development"]) {
      process.env.NODE_ENV = nodeEnv;
      process.env.NEXT_PUBLIC_SEASON_OVERRIDE = "pulse";
      for (const vercelEnv of [undefined, "development", "preview", "production"]) {
        if (vercelEnv === undefined) delete process.env.VERCEL_ENV;
        else process.env.VERCEL_ENV = vercelEnv;
        assert.equal(getDevSeasonOverride(), vercelEnv === "production" ? null : PULSE);
      }
    }
    delete process.env.VERCEL_ENV;
    delete process.env.NEXT_PUBLIC_SEASON_OVERRIDE;
    assert.equal(getDevSeasonOverride(), null);
    process.env.NEXT_PUBLIC_SEASON_OVERRIDE = "unknown";
    assert.equal(getDevSeasonOverride(), null);
  } finally {
    for (const [key, value] of [["NODE_ENV", original.nodeEnv], ["VERCEL_ENV", original.vercelEnv], ["NEXT_PUBLIC_SEASON_OVERRIDE", original.override]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test("unrecognized shapes, missing values and prototype keys fall back safely", () => {
  for (const value of ["future-shape", "__proto__", "constructor", "", null, undefined, 6]) {
    assert.equal(normalizeForma(value), "square");
    assert.equal(getShapePath(value, "fallback"), getShapePath("square", "fallback"));
  }
  assert.equal(normalizeForma("double-circle"), "double-circle");
  assert.equal(normalizeForma("triangle"), "triangle");
  assert.equal(getShapePath("double-circle", "one"), SHAPE_PATHS["double-circle"]);
  assert.equal(getShapePath("double-circle", "two"), SHAPE_PATHS["double-circle"]);
});
