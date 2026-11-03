import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../lib/color-contrast.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
const { PAPER, INK, contrastRatio, readableOn, readableTextOn, paperGlow } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

test("contraste WCAG: extremos y simetría", () => {
  assert.equal(contrastRatio("#000000", "#FFFFFF").toFixed(0), "21");
  assert.equal(contrastRatio("#C8D0D2", "#C8D0D2"), 1);
  assert.equal(contrastRatio("#3DFF5C", PAPER), contrastRatio(PAPER, "#3DFF5C"));
});

test("el rol 3 sobre papel cae al principal sólo si no contrasta (regla genérica, sin slugs)", () => {
  // Jungle: verde ácido 1.17:1 sobre papel → principal.
  assert.ok(contrastRatio("#3DFF5C", PAPER) < 1.2);
  assert.equal(readableOn(PAPER, "#3DFF5C", "#0F8A34"), "#0F8A34");
  // Un rol 3 oscuro que sí contrasta se respeta.
  assert.equal(readableOn(PAPER, "#0A3D1F", "#0F8A34"), "#0A3D1F");
  // Sobre tinta el ácido es legible y se mantiene.
  assert.equal(readableOn("#111111", "#3DFF5C", "#0F8A34"), "#3DFF5C");
  // #RGB abreviado se interpreta igual que #RRGGBB.
  assert.equal(contrastRatio("#3F5", PAPER), contrastRatio("#33FF55", PAPER));
  // Hex inválido nunca rompe: cae al principal.
  assert.equal(readableOn(PAPER, "verde", "#0F8A34"), "#0F8A34");
});

test("texto sobre acento: papel o tinta, el que más contraste", () => {
  assert.equal(readableTextOn("#0F8A34"), INK); // Jungle
  assert.equal(readableTextOn("#E5233B"), INK); // Pulse
  assert.equal(readableTextOn("#7B3FE4"), PAPER); // Ascent
  assert.equal(readableTextOn("#1E38F5"), PAPER); // Origin
  for (const bg of ["#0F8A34", "#E5233B", "#7B3FE4", "#1E38F5"]) {
    const text = readableTextOn(bg);
    assert.ok(contrastRatio(text, bg) >= contrastRatio(text === INK ? PAPER : INK, bg));
  }
});

test("glow sobre papel: si el rol 3 no contrasta, se tiñe hacia el principal y baja", () => {
  const jungle = paperGlow("#3DFF5C", "#0F8A34");
  assert.equal(jungle.color, "color-mix(in srgb, #3DFF5C 35%, #0F8A34)");
  assert.ok(jungle.pct(55) < 55);
  const dark = paperGlow("#0A3D1F", "#0F8A34");
  assert.equal(dark.color, "#0A3D1F");
  assert.equal(dark.pct(55), 55);
});
