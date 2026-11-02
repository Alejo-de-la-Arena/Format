// Toda Server Action exportada desde un archivo "use server" de app/admin
// tiene que pasar por adminAction (que llama a requireAdmin). Este test lee
// el AST de cada archivo: no ejecuta nada ni se conecta a Supabase.
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import ts from "typescript";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ADMIN_DIR = path.join(ROOT, "app", "admin");
const WRAPPER_MODULE = "@/lib/auth/admin-action";

// Acciones que tienen que funcionar SIN ser admin. Cualquier otra excepción
// es un agujero: agregarla acá requiere una razón explícita.
const PUBLIC_ACTIONS = {
  "app/admin/login/actions.ts": ["signIn", "signOut"], // login y logout
};

const hasDirective = (statements, text) =>
  statements.some((s) => ts.isExpressionStatement(s) && ts.isStringLiteral(s.expression) && s.expression.text === text);

/** Devuelve { isServerFile, exports: [{ name, ok, why }], inlineDirectives } */
export function analyze(source, fileName = "file.ts") {
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  // Sólo cuentan los prólogos: directivas antes de cualquier otra sentencia.
  const prologue = [];
  for (const s of sf.statements) {
    if (ts.isExpressionStatement(s) && ts.isStringLiteral(s.expression)) prologue.push(s);
    else break;
  }
  const isServerFile = hasDirective(prologue, "use server");

  // "use server" dentro de funciones = acciones inline que este test no cubre.
  let inlineDirectives = 0;
  const visit = (node) => {
    if ((ts.isFunctionLike(node)) && node.body && ts.isBlock(node.body) && hasDirective(node.body.statements, "use server")) {
      inlineDirectives++;
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  const wrapperNames = new Set();
  for (const s of sf.statements) {
    if (ts.isImportDeclaration(s) && s.moduleSpecifier.text === WRAPPER_MODULE) {
      for (const el of s.importClause?.namedBindings?.elements ?? []) {
        if ((el.propertyName ?? el.name).text === "adminAction") wrapperNames.add(el.name.text);
      }
    }
  }

  const exports = [];
  const isExported = (node) => ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export;
  for (const s of sf.statements) {
    if (ts.isTypeAliasDeclaration(s) || ts.isInterfaceDeclaration(s)) continue;
    if (ts.isVariableStatement(s) && isExported(s)) {
      for (const d of s.declarationList.declarations) {
        const init = d.initializer;
        const ok = !!init && ts.isCallExpression(init) && ts.isIdentifier(init.expression) && wrapperNames.has(init.expression.text);
        exports.push({ name: d.name.getText(sf), ok, why: ok ? "" : "no está envuelta en adminAction" });
      }
    } else if (ts.isFunctionDeclaration(s) && isExported(s)) {
      exports.push({ name: s.name?.text ?? "default", ok: false, why: "función exportada sin adminAction" });
    } else if (ts.isExportAssignment(s)) {
      exports.push({ name: "default", ok: false, why: "export default" });
    } else if (ts.isExportDeclaration(s) && !s.isTypeOnly) {
      exports.push({ name: s.getText(sf), ok: false, why: "re-export: no se puede verificar" });
    }
  }
  return { isServerFile, exports, inlineDirectives };
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

test("el analizador detecta acciones sin adminAction", () => {
  const ok = analyze(`"use server";
import { adminAction } from "${WRAPPER_MODULE}";
export type S = { a: 1 };
export const a = adminAction(async (ctx, x: string) => x);`);
  assert.equal(ok.isServerFile, true);
  assert.deepEqual(ok.exports.map((e) => [e.name, e.ok]), [["a", true]]);

  const bad = analyze(`"use server";
import { adminAction as wrap } from "${WRAPPER_MODULE}";
import { other } from "./other";
export async function plain() {}
export const viaOther = other(async () => {});
export const arrow = async () => {};
export const aliased = wrap(async () => {});
export { x } from "./x";
export default async function d() {}`);
  assert.deepEqual(bad.exports.map((e) => [e.name, e.ok]), [
    ["plain", false], ["viaOther", false], ["arrow", false], ["aliased", true],
    ['export { x } from "./x";', false], ["d", false],
  ]);

  // Un adminAction que no viene del módulo del wrapper no cuenta.
  const fake = analyze(`"use server";
const adminAction = (f) => f;
export const sneaky = adminAction(async () => {});`);
  assert.equal(fake.exports[0].ok, false);

  assert.equal(analyze(`export function f() { "use server"; }`).inlineDirectives, 1);
  assert.equal(analyze(`const x = 1;\n"use server";`).isServerFile, false);
});

test("toda acción exportada de app/admin pasa por adminAction", async () => {
  const files = await walk(ADMIN_DIR);
  const problems = [];
  const seenPublic = new Set();
  let serverFiles = 0;
  let wrapped = 0;

  for (const file of files) {
    const rel = path.relative(ROOT, file).split(path.sep).join("/");
    const { isServerFile, exports, inlineDirectives } = analyze(await readFile(file, "utf8"), file);
    if (inlineDirectives) problems.push(`${rel}: "use server" inline (${inlineDirectives}); mover la acción a un archivo de acciones con adminAction`);
    if (!isServerFile) continue;
    serverFiles++;
    const allowed = PUBLIC_ACTIONS[rel] ?? [];
    for (const e of exports) {
      if (e.ok) { wrapped++; continue; }
      if (allowed.includes(e.name)) { seenPublic.add(`${rel}#${e.name}`); continue; }
      problems.push(`${rel}: ${e.name} — ${e.why}`);
    }
  }

  for (const [rel, names] of Object.entries(PUBLIC_ACTIONS)) {
    for (const name of names) {
      if (!seenPublic.has(`${rel}#${name}`)) problems.push(`excepción obsoleta: ${rel}#${name} ya no existe`);
    }
  }

  assert.deepEqual(problems, []);
  assert.ok(serverFiles >= 5, `se esperaban al menos 5 archivos "use server", hubo ${serverFiles}`);
  assert.ok(wrapped >= 16, `se esperaban al menos 16 acciones envueltas, hubo ${wrapped}`);
});
