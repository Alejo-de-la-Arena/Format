import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.FORMAT_PLAYWRIGHT ? pathToFileURL(process.env.FORMAT_PLAYWRIGHT).href : 'playwright');
const browser = await chromium.launch({headless:true,...(process.env.FORMAT_CHROME ? {executablePath:process.env.FORMAT_CHROME}: {})});
const url='http://127.0.0.1:4320';
const dir='artifacts/intro'; await mkdir(dir,{recursive:true});
const report={frames:[],errors:[],existingConsoleIssues:[],durations:[]};
try {
for (const width of [360,390,1440]) {
 const ctx=await browser.newContext({viewport:{width,height:width===1440?900:844}});
 await ctx.addInitScript(()=>{
  window.introTiming={};
  const show=HTMLDialogElement.prototype.showModal;
  HTMLDialogElement.prototype.showModal=function(){window.introTiming.start=performance.now();delete window.introTiming.end;return show.call(this)};
  const close=HTMLDialogElement.prototype.close;
  HTMLDialogElement.prototype.close=function(){if(this.open)window.introTiming.end=performance.now();return close.call(this)};
  window.playCalls=0;HTMLMediaElement.prototype.play=function(){window.playCalls++;return Promise.resolve()};
 });
 const page=await ctx.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 page.on('console',m=>{
  if(!['error','warning'].includes(m.type())) return;
  // Existing development analytics scripts are blocked by the site's CSP.
  const known=m.text().includes('https://va.vercel-scripts.com/')&&m.text().includes('Content Security Policy');
  (known?report.existingConsoleIssues:report.errors).push(m.text());
 });
 await page.goto(url,{waitUntil:'commit'});
 await page.waitForFunction(()=>window.introTiming.start);
  assert.equal(await page.locator('#season-welcome').innerText(),'THE ENERGY RISES.\nWELCOME TO ASCENT');
  assert.equal(await page.locator('[class*="salutation"]').evaluate(e=>getComputedStyle(e).color),'rgb(123, 63, 228)');
 await page.mouse.click(20,20);assert.ok(await page.evaluate(()=>window.playCalls>0));
 await page.waitForFunction(()=>window.introTiming.end);
 const duration=await page.evaluate(()=>window.introTiming.end-window.introTiming.start);report.durations.push({width,duration});console.log({width,duration});assert.ok(duration>=2750&&duration<3000);
 await page.reload(); await page.waitForTimeout(400);assert.equal(await page.locator('dialog[open]').count(),0);
 await ctx.close();

 const frameCtx=await browser.newContext({viewport:{width,height:width===1440?900:844}});
 await frameCtx.addInitScript(()=>{
   const timer=window.setTimeout;
   window.setTimeout=(cb,delay,...args)=>timer(cb,String(cb).includes('introOpen')?60000:delay,...args);
   const show=HTMLDialogElement.prototype.showModal;
   HTMLDialogElement.prototype.showModal=function(){show.call(this);this.getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=180})};
 });
 const frame=await frameCtx.newPage();await frame.goto(url,{waitUntil:'commit'});
 await frame.locator('dialog[open]').waitFor({state:'attached',timeout:60000});
 for(const ms of [180,1000,2600]) {
  await frame.evaluate(ms=>document.querySelector('dialog').getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=ms}),ms);
  assert.ok(await frame.locator('#season-welcome').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth}));
  const path=`${dir}/${width}-${ms}ms.png`;
  await frame.screenshot({path});report.frames.push(path);
 }
 await frameCtx.close();
}
const reduced=await browser.newContext({reducedMotion:'reduce'});const rp=await reduced.newPage();await rp.goto(url);assert.equal(await rp.locator('dialog[open]').count(),0);assert.equal(await rp.locator('body').evaluate(e=>getComputedStyle(e).visibility),'visible');await reduced.close();
const pre=await browser.newContext();const pp=await pre.newPage();await pp.route('**/_next/static/chunks/**/*.js',r=>r.abort());await pp.goto(url,{waitUntil:'commit'});assert.equal(await pp.locator('body').evaluate(e=>getComputedStyle(e).visibility),'hidden');await pre.close();
await writeFile(`${dir}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));assert.deepEqual(report.errors,[]);
}finally{await browser.close()}
