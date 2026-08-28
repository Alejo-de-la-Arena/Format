import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const source = await readFile(new URL("../components/ActionIcon.tsx", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: {
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
} });
const exports = {};
new Function("require", "exports", outputText)(createRequire(import.meta.url), exports);

test("action icons render as decorative, themeable vectors, not font glyphs", () => {
  for (const kind of ["forward", "chevron", "external", "share", "check"]) {
    const markup = renderToStaticMarkup(createElement(exports.default, { kind }));
    assert.match(markup, /^<svg /);
    assert.match(markup, /aria-hidden="true"/);
    assert.match(markup, /focusable="false"/);
    assert.match(markup, /stroke="currentColor"/);
    assert.match(markup, /<path d="[^"]+"/);
    assert.equal(markup.replace(/<[^>]*>/g, ""), "");
  }
});

test("public UI has no literal Unicode arrow glyphs that can fall back to emoji", async () => {
  async function scan(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.name === "admin") continue;
      const path = new URL(entry.name + (entry.isDirectory() ? "/" : ""), dir);
      if (entry.isDirectory()) { await scan(path); continue; }
      if (!entry.name.endsWith(".tsx")) continue;
      const file = ts.createSourceFile(path.pathname, await readFile(path, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const visit = (node) => {
        if (ts.isJsxText(node) || ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
          assert.doesNotMatch(node.text, /[\u2190-\u2199\u27a1\u2b05-\u2b07]/u, path.pathname);
        }
        ts.forEachChild(node, visit);
      };
      visit(file);
    }
  }
  await scan(new URL("../app/", import.meta.url));
  await scan(new URL("../components/", import.meta.url));
});
