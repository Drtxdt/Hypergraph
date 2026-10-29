import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {generate,serve} from './verify/fixture.mjs';
const out=path.resolve('.local/reading-beta2');await fs.mkdir(out,{recursive:true});
const servers=[];const browser=await chromium.launch({channel:'msedge'});const results=[];
try {for(const [name,options] of Object.entries({cover:{},noCover:{noCover:true}})){
const base=path.join(out,name);await fs.rm(path.join(base,"db.json"),{force:true});await generate(base,options);const server=await serve(base);servers.push(server);
for(const width of [1440,390])for(const mode of ['light','dark']){
const context=await browser.newContext({viewport:{width,height:width===1440?1000:844}});const page=await context.newPage();
await page.goto(server.url+'2026/10/29/field-study/',{waitUntil:'networkidle'});
await page.evaluate(m=>document.documentElement.dataset.mode=m,mode);await page.waitForTimeout(500);
assert.equal(await page.locator('[data-rail-expand]').count(),0);assert.equal(await page.locator('[data-intro]').count(),0);
const measurement=await page.evaluate(()=>{const h=document.querySelector('.article-head').getBoundingClientRect(),b=document.querySelector('.prose').getBoundingClientRect();return{titleX:h.x,bodyX:b.x,bodyY:b.y,overflow:document.documentElement.scrollWidth>innerWidth}});
assert.ok(Math.abs(measurement.titleX-measurement.bodyX)<2);assert.equal(measurement.overflow,false);
if(width===1440){await page.mouse.move(800,600);await page.mouse.move(30,200);await page.waitForFunction(()=>document.querySelector('.rail-open'));await page.mouse.move(800,600);await page.waitForTimeout(400);}
await page.screenshot({path:path.join(out,`${name}-${width}-${mode}.png`)});results.push({name,width,mode,...measurement});await context.close();
}}
await fs.writeFile(path.join(out,'report.json'),JSON.stringify({passed:true,results},null,2));console.log(JSON.stringify(results));
}finally{await browser.close();for(const s of servers)await s.close();}
