import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.FORMAT_PLAYWRIGHT).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.FORMAT_CHROME,args:['--disable-extensions','--enable-unsafe-swiftshader']});
const base=process.env.FORMAT_PREVIEW_URL||'http://127.0.0.1:4315';
const identity=process.env.FORMAT_QA_SEASON||'pulse';
const out=`artifacts/pulse/release/${identity}`;await mkdir(out,{recursive:true});
const report={identity,runs:[],errors:[],warnings:[],forbiddenRequests:[]};
try {
for(const width of [1440,390,360]) {
 const ctx=await browser.newContext({viewport:{width,height:900}});
 await ctx.addInitScript(()=>{sessionStorage.setItem('format:visit-intro:v2:pulse:2026-10-09','1');sessionStorage.setItem('format:visit-intro:v2:ascent:2026-09-11','1');});
 const page=await ctx.newPage();
 page.on('pageerror',e=>report.errors.push({width,message:e.message}));
 page.on('console',m=>{if(m.type()==='error')report.errors.push({width,message:m.text()});if(m.type()==='warning')report.warnings.push({width,message:m.text()});});
 page.on('request',r=>{if(/\.(mp3|wav|ogg)(\?|$)|\/music\//i.test(r.url())||(/supabase\.co/.test(r.url())&&!['GET','HEAD','OPTIONS'].includes(r.method())))report.forbiddenRequests.push(r.url());});
 for(const route of ['/','/eventos/ascent','/proximas-fechas','/calendario','/experience','/about']) {
  const response=await page.goto(base+route,{waitUntil:'load'});assert.equal(response.status(),200,route);
  await page.waitForFunction(()=>!document.querySelector('[data-pulse-intro]')?.open && !document.documentElement.hasAttribute('data-intro-preflight'));
  await page.waitForTimeout(800);
  assert.equal(await page.locator('audio').count(),0);
  assert.equal(await page.getByRole('button',{name:/pausar música|reanudar música/i}).count(),0);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${route} overflow at ${width}`);
  if(route==='/') {
   assert.ok(await page.locator('nav').getAttribute('class'));
   assert.ok(await page.getByLabel('Season actual: '+(identity==='pulse'?'PULSE':'Ascent'),{exact:true}).count());
   const mystery=page.getByLabel('Próximamente',{exact:true});assert.equal(await mystery.locator('svg text').count(),2);
   if(identity==='pulse') {
    assert.ok(await page.getByText('003 PULSE',{exact:true}).count());
    assert.ok(await page.getByText('Así se vivió Ascent.',{exact:true}).count());
    assert.ok(await page.getByText('Pulse te espera.',{exact:true}).count());
    assert.ok(await page.getByRole('button',{name:'Reproducir Ascent',exact:true}).count());
   }
  }
  if(route==='/eventos/ascent') {
   const accents=await page.locator('[style]').evaluateAll(es=>es.map(e=>e.style.getPropertyValue('--accent-1')).filter(Boolean));
   assert.ok(accents.some(c=>c.toLowerCase()==='#7b3fe4'),JSON.stringify(accents));
   assert.ok(await page.locator('svg path').count()>0);
  }
  if(route==='/experience') { const grid=page.locator('[data-experience-grid]');await grid.scrollIntoViewIfNeeded();assert.ok(await grid.locator('button').count()>=2); }
  for(let y=0;y<await page.evaluate(()=>document.documentElement.scrollHeight);y+=700) {
    await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(150);
  }
  await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(300);
  await page.screenshot({path:`${out}/${width}-${route==='/'?'home':route.replaceAll('/','').replace('eventos','eventos-')}.png`,fullPage:true});
  report.runs.push({width,route,status:response.status()});
 }
 await ctx.close();
}
assert.deepEqual(report.errors,[]);assert.deepEqual(report.forbiddenRequests,[]);
}finally{await writeFile(`${out}/checks.json`,JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify(report));
