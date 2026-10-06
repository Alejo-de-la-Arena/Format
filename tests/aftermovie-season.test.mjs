import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
async function moduleUrl(file) {
 let source=ts.transpileModule(await readFile(new URL(`../${file}`,import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
 for(const match of source.matchAll(/from "\.\/(.*?)"/g)) source=source.replace(match[0],`from "${await moduleUrl(`lib/${match[1]}.ts`)}"`);
 return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
}
const {getAftermovieSeason,seasonDisplayName}=await import(await moduleUrl('lib/aftermovie-season.ts'));
const origin={slug:'origin',fechaInicio:'2026-08-07',aftermovieUrl:'https://youtu.be/BHTijIqNL7M'};
const ascent={slug:'ascent',fechaInicio:'2026-09-11',forma:'triangle',colores:['#7B3FE4'],aftermovieUrl:'https://youtu.be/f0UNTvf2K3E'};
const pulse={slug:'pulse',fechaInicio:'2026-10-09',forma:'double-circle',colores:['#E5233B']};
test('a current video wins; otherwise use the latest earlier valid video',()=>{
 assert.equal(getAftermovieSeason(pulse,[ascent,origin]),ascent);
 assert.equal(getAftermovieSeason({...pulse,aftermovieUrl:'invalid'},[origin,ascent]),ascent);
 const recorded={...pulse,aftermovieUrl:origin.aftermovieUrl};
 assert.equal(getAftermovieSeason(recorded,[origin,ascent]),recorded);
 assert.equal(ascent.forma,'triangle');assert.equal(ascent.colores[0],'#7B3FE4');
 assert.equal(pulse.forma,'double-circle');assert.equal(pulse.colores[0],'#E5233B');
});
test('empty histories and future videos are safe; display names keep requested casing',()=>{
 assert.equal(getAftermovieSeason(null,[origin]),null);
 assert.equal(getAftermovieSeason(origin,[pulse]),origin);
 assert.equal(getAftermovieSeason(pulse,[]),null);
 assert.equal(seasonDisplayName('PULSE'),'Pulse');
 assert.equal(seasonDisplayName('Ascent'),'Ascent');
});
