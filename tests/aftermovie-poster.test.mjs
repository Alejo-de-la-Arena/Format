import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

async function load(path) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
}
const { getAftermoviePoster } = await load("../lib/aftermovie-poster.ts");
const { getIntroSeasons } = await load("../lib/season-intro.ts");
const { parseVideoUrl } = await load("../lib/embed.ts");

test("Ascent pairs its local cover with its actual video, before the migration", () => {
  const origin = { slug: "origin", fechaInicio: "2026-08-07", fechaFin: "2026-09-04" };
  const ascent = { slug: "ascent", fechaInicio: "2026-09-11", fechaFin: "2026-10-02", aftermovieUrl: "https://www.youtube.com/watch?v=f0UNTvf2K3E" };
  const pulse = { slug: "pulse", fechaInicio: "2026-10-09", fechaFin: "2026-11-06" };
  const { current } = getIntroSeasons([origin, ascent, pulse], "2026-09-21");
  assert.equal(getAftermoviePoster(current), "/images/aftermovie-ascent-portada.jpg");
  assert.equal(parseVideoUrl(current.aftermovieUrl).id, "f0UNTvf2K3E");
  assert.equal(getAftermoviePoster(origin), "/images/aftermovie-portada.png");
});

test("uploaded cover takes precedence; a new Season never inherits Origin's cover", () => {
  const uploaded = "https://example.test/storage/v1/object/public/season-previews/new.webp";
  assert.equal(getAftermoviePoster({ slug: "ascent", aftermoviePosterUrl: uploaded }), uploaded);
  assert.equal(getAftermoviePoster({ slug: "pulse", aftermoviePosterUrl: uploaded }), uploaded);
  assert.equal(getAftermoviePoster({ slug: "pulse" }), undefined);
  assert.equal(getAftermoviePoster({ slug: "constructor" }), undefined);
});