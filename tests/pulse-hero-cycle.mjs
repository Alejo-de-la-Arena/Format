import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.FORMAT_PLAYWRIGHT).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.FORMAT_CHROME,args:['--enable-unsafe-swiftshader']});
const out='artifacts/pulse/hero';await mkdir(out,{recursive:true});const report={frames:[],errors:[]};
try {
for(const [width,height] of [[1440,900],[1920,1080],[1280,720],[390,844],[360,740]]) {
 const ctx=await browser.newContext({viewport:{width,height}});
 await ctx.addInitScript(()=>{sessionStorage.setItem('format:visit-intro:v2:pulse:2026-10-09','1');window.qaTime=0;
 for(const proto of [WebGLRenderingContext.prototype,WebGL2RenderingContext.prototype]) {
 const names=new WeakMap(),get=proto.getUniformLocation,set=proto.uniform1f;
 proto.getUniformLocation=function(p,n){const l=get.call(this,p,n);if(l)names.set(l,n);return l;};
 proto.uniform1f=function(l,v){return set.call(this,l,names.get(l)==='uTime'?window.qaTime:v);};
 }});
 const page=await ctx.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error' && /shader|WebGL|GLSL/i.test(m.text()))report.errors.push(m.text());});
 await page.goto(process.env.FORMAT_PREVIEW_URL || 'http://127.0.0.1:4315',{waitUntil:'load'});
 const canvas=page.locator('canvas[data-motion="running"]');await canvas.waitFor({timeout:30000});
 for(const time of [...Array.from({length:12},(_,i)=>i*2),22.4]) {
 await page.evaluate(t=>window.qaTime=t,time);await page.waitForTimeout(120);
 const buffer=await canvas.screenshot();
 const bounds=await page.evaluate(async({data,cell})=>{
 const img=new Image();img.src='data:image/png;base64,'+data;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const x=c.getContext('2d');x.drawImage(img,0,0);const p=x.getImageData(0,0,c.width,c.height).data;let xmin=c.width,ymin=c.height,xmax=0,ymax=0;
 for(let y=0;y<c.height-cell;y+=cell)for(let xx=0;xx<c.width-cell;xx+=cell){let total=0;for(let j=0;j<cell;j++)for(let i=0;i<cell;i++){let k=((y+j)*c.width+xx+i)*4;total+=Math.max(0,p[k]-p[k+1]);} if(total/(cell*cell)>25){xmin=Math.min(xmin,xx);ymin=Math.min(ymin,y);xmax=Math.max(xmax,xx+cell);ymax=Math.max(ymax,y+cell);}}
 return {xmin,ymin,xmax,ymax,width:c.width,height:c.height,cell};
 },{data:buffer.toString('base64'),cell:width<768?3:6});
 assert.ok(bounds.xmin>=bounds.cell && bounds.ymin>=bounds.cell && bounds.width-bounds.xmax>=bounds.cell && bounds.height-bounds.ymax>=bounds.cell,JSON.stringify(bounds));
 await page.screenshot({path:`${out}/${width}x${height}-${time.toFixed(1)}s.png`});
 report.frames.push({width,height,time,mode:Math.floor(time/2.8)%8+1,bounds});
 }
 await ctx.close();
}
assert.deepEqual(report.errors,[]);
}finally{await writeFile(`${out}/checks.json`,JSON.stringify(report,null,2));await browser.close();}
console.log('65 frames over the complete original 22.4s cycle: all shapes inside the hero with at least one-cell margin');
