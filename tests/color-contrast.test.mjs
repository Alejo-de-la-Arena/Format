import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../lib/color-contrast.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
const { PAPER, contrastRatio, readableOn } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

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
