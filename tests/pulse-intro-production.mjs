import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL(process.env.FORMAT_PLAYWRIGHT).href);
const browser = await chromium.launch({headless:true, executablePath: process.env.FORMAT_CHROME, args:['--enable-unsafe-swiftshader']});
const url=process.env.FORMAT_PREVIEW_URL || 'http://127.0.0.1:4315';
const out='artifacts/pulse/intro-production'; await mkdir(out,{recursive:true});
const report={cpu:4,runs:[],errors:[]};
try {
for(const [width,height,reduced] of [[1440,900,false],[390,844,false],[360,740,false],[390,844,true]]) {
 const ctx=await browser.newContext({viewport:{width,height},reducedMotion:reduced?'reduce':'no-preference'});
 await ctx.addInitScript(()=>{
  window.qa={longTasks:[],contexts:[],samples:[]};
  new PerformanceObserver(list=>window.qa.longTasks.push(...list.getEntries().map(e=>({start:e.startTime,duration:e.duration})))).observe({type:'longtask',buffered:true});
  const get=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type,...args){ if(type.includes('webgl')) window.qa.contexts.push(performance.now()); return get.call(this,type,...args); };
  const close=HTMLDialogElement.prototype.close;
  HTMLDialogElement.prototype.close=function(){if(this.dataset.started) window.qa.end=performance.now(); return close.call(this);};
  const sample=()=>{const d=document.querySelector('[data-pulse-intro]');if(d?.dataset.started && d.open) {
   const p=d.querySelector('[data-primary]'); const r=d.querySelector('[data-ring-stage]');
   window.qa.samples.push({t:performance.now()-Number(d.dataset.started),tape:p?getComputedStyle(p).opacity:null,ring:r?getComputedStyle(r).transform:null});
  } requestAnimationFrame(sample);}; requestAnimationFrame(sample);
 });
 const page=await ctx.newPage(); const cdp=await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 page.on('pageerror',e=>report.errors.push(e.message));
 const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
 assert.ok((await response.text()).includes('data-paper'));
 await page.waitForFunction(()=>document.querySelector('[data-pulse-intro]')?.dataset.started,{},{timeout:60000});
 const start=await page.locator('[data-pulse-intro]').getAttribute('data-started');
 assert.equal(await page.evaluate(()=>Object.keys(sessionStorage).some(k=>k.startsWith('format:visit-intro') && sessionStorage[k]==='1')),false);
 for(const frame of reduced?[400]:[300,800,1100,1800,2200,2700]) {
  await page.waitForFunction(({start,frame})=>performance.now()>=Number(start)+frame,{start,frame});
  await page.screenshot({path:`${out}/${width}-${reduced?'reduced':frame}.png`});
 }
 await page.waitForFunction(()=>!document.querySelector('[data-pulse-intro]')?.open,{},{timeout:15000});
 await page.waitForFunction(()=>window.qa.contexts.length>0,{},{timeout:30000});
 const qa=await page.evaluate(()=>window.qa); qa.start=Number(start); qa.width=width;qa.height=height;qa.reduced=reduced;
 qa.introLongTasks=qa.longTasks.filter(e=>e.start>=qa.start && e.start<qa.end);
 assert.ok(qa.contexts.every(t=>t>=qa.end),'WebGL must initialize after intro');
 assert.ok(qa.end-qa.start >= (reduced?900:2900),'complete timeline');
 report.runs.push(qa);
 await page.reload({waitUntil:'load'}); await page.waitForFunction(()=>!document.querySelector('[data-pulse-intro]')?.open);
 await ctx.close();
}
} finally { await writeFile(`${out}/checks.json`,JSON.stringify(report,null,2)); await browser.close(); }
console.log(JSON.stringify(report.runs.map(r=>({width:r.width,reduced:r.reduced,duration:r.end-r.start,longTasks:r.introLongTasks,contexts:r.contexts})),null,2));
assert.deepEqual(report.errors,[]);
