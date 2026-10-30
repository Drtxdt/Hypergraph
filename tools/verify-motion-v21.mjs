import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {generate,serve} from './verify/fixture.mjs';

/** Records theme motion after the ordinary browser and performance suites. */
export async function checkMotionV21(browser, sites, out, report = {}) {
 const dir=path.join(out,'motion-v21');
 await fs.mkdir(dir,{recursive:true});
 const checks=[];
 const inspect = async (page) => {
  await page.addInitScript(() => {
   window.introEvidence=[];
   window.introFrames=[]; window.introEndCount=0;
   document.addEventListener('hypergraph:intro-end',()=>window.introEndCount++);
   const sample=()=>{const h=document.querySelector('[data-intro]');if(h&&!h.hidden){window.introFrames.push({at:performance.now(),value:Number(h.querySelector('[data-intro-value]').textContent),bar:Number(h.querySelector('[data-intro-progress]').style.getPropertyValue('--progress'))});}if(!window.introEndCount)requestAnimationFrame(sample);};requestAnimationFrame(sample);
   const record=()=>{
    const host=document.querySelector('[data-intro]');
    const active=document.documentElement.classList.contains('intro-active');
    const visible=!!host&&!host.hidden&&getComputedStyle(host).display!=='none'&&host.getBoundingClientRect().height>0;
    const previous=window.introEvidence.at(-1);
    if(!previous||previous.active!==active||previous.visible!==visible)window.introEvidence.push({at:performance.now(),active,visible});
   };
   new MutationObserver(record).observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden']});
   document.addEventListener('DOMContentLoaded',record);
  });
 };
 const ended = async(page)=>{
  await page.waitForFunction(()=>!document.documentElement.classList.contains('intro-active'));
  assert.equal(await page.locator('[data-intro]').isVisible(),false);
 };
 const visibleOnce=async(page)=>{
  await page.waitForFunction(()=>window.introEvidence.some(x=>x.visible));
  assert.ok((await page.evaluate(()=>window.introEvidence)).some(x=>x.active&&x.visible),'intro must actually be painted, not merely absent after load');
 };
 for(const width of [1440,390]) {
  const context=await browser.newContext({viewport:{width,height:width===1440?900:844},recordVideo:{dir:path.join(dir,'video')}});
  try {
   const page=await context.newPage(); await inspect(page);
   await page.goto(sites.main.url,{waitUntil:'domcontentloaded'});
   await visibleOnce(page);
   if(await page.locator('[data-intro]').isVisible())await page.screenshot({path:path.join(dir,`intro-${width}.png`)});
   await ended(page);
   await page.waitForFunction(()=>document.querySelector('#content').getAnimations({subtree:true}).every(a=>a.playState==='finished'));
   await page.screenshot({path:path.join(dir,`home-${width}-light.png`)});
   const evidence=await page.evaluate(()=>window.introEvidence);
   const frames=await page.evaluate(()=>window.introFrames);
   await fs.writeFile(path.join(dir,`timeline-${width}.json`),JSON.stringify(frames));
   for(let i=1;i<frames.length;i++) {assert.ok(frames[i].value>=frames[i-1].value);assert.ok(Math.abs(frames[i].bar*100-frames[i].value)<1.1);}
   const held=frames.filter(f=>f.value===60);assert.ok(held.length>1 && held.at(-1).at-held[0].at>=500 && held.at(-1).at-held[0].at<=750,'60% holds 600ms');
   assert.equal(await page.evaluate(()=>window.introEndCount),1);
   await fs.writeFile(path.join(dir,`timeline-${width}.json`),JSON.stringify(frames));
   await page.reload({waitUntil:'domcontentloaded'});
   await visibleOnce(page); await ended(page);
   if(width===1440) {
    await page.mouse.move(600,500);await page.locator('.site-header').hover({position:{x:30,y:100}});
    await page.waitForFunction(()=>document.querySelector('.site-header').classList.contains('rail-open'));
    await page.screenshot({path:path.join(dir,'navigation-open.png')});
    await page.mouse.move(900,800);
    await page.waitForFunction(()=>!document.querySelector('.site-header').classList.contains('rail-open'));
   }
   await page.locator('.lead-link').click();
   await page.waitForURL('**/field-study/');
   await page.waitForFunction(()=>document.querySelector('.article-head')&&document.querySelector('#content').getAnimations({subtree:true}).every(a=>a.playState==='finished'));
   await page.screenshot({path:path.join(dir,`article-${width}-light.png`)});
   for(const [name,site] of [['home',sites.main],['no-cover',sites.noCover]]) {
    await page.goto(site.url,{waitUntil:'domcontentloaded'});await ended(page);
    await page.evaluate(()=>document.documentElement.dataset.mode='dark');
    await page.waitForFunction(()=>document.querySelector('#content').getAnimations({subtree:true}).every(a=>a.playState==='finished'));
    await page.waitForTimeout(300); // Allow color transitions to reach the screenshot's named final state.
    await page.screenshot({path:path.join(dir,`${name}-${width}-dark.png`)});
    if(name==='no-cover') assert.equal(await page.locator('.lead-media img').count(),0);
   }
   checks.push({name:'recorded-flow',width,evidence,sessionReload:true,hover:width===1440,article:true,dark:true,noCover:true});
  } finally {await context.close();}
 }
 for(const name of ['reduced','storage-blocked','skip','main-blocked','resource-failed','save-data']) {
  const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:name==='reduced'?'reduce':'no-preference'});
  try {
   const page=await context.newPage();await inspect(page);
   if(name==='storage-blocked')await page.addInitScript(()=>{Storage.prototype.getItem=function(){throw new Error('storage disabled')};Storage.prototype.setItem=function(){throw new Error('storage disabled')};});
   if(name==='save-data')await page.addInitScript(()=>Object.defineProperty(navigator,'connection',{value:{saveData:true},configurable:true}));
   if(name==='main-blocked')await page.route('**/assets/main.js',r=>r.abort());
   if(name==='resource-failed')await page.route(/\.(?:svg|woff2)(?:\?.*)?$/,r=>r.abort());
   await page.goto(sites.main.url,{waitUntil:'domcontentloaded'});
   if(['reduced','save-data'].includes(name)) {
    await page.waitForTimeout(250);
    assert.equal(await page.evaluate(()=>window.introEvidence.some(x=>x.active)),false,`${name}: intro should not start`);
   } else {
    await visibleOnce(page);
    if(name==='skip') {
     await page.locator('[data-intro] button').click();
     await ended(page);
    } else await ended(page);
   }
   const evidence=await page.evaluate(()=>window.introEvidence);
   if(name==='main-blocked') {
    const first=evidence.find(x=>x.active);
    const final=evidence.find(x=>x.at>first.at&&!x.active);
    assert.ok(final&&final.at-first.at<=2500,'bootstrap must release within the readability budget including observation tolerance');
    assert.equal(await page.locator('[data-intro]').getAttribute('data-end-reason'),'error','blocked script releases through explicit error path');
   }
   assert.ok(await page.locator('#content').isVisible());
   checks.push({name,passed:true,evidence});
  } finally {await context.close();}
 }
 // The disabled fixture verifies that off renders neither loader nor its module request.
 const context=await browser.newContext();
 try {
  const page=await context.newPage();const requests=[];page.on('request',r=>requests.push(r.url()));
  await page.goto(sites.disabled.url,{waitUntil:'networkidle'});
  assert.equal(await page.locator('[data-intro]').count(),0);
  assert.equal(requests.some(u=>/chunk-intro-/.test(u)),false);
  checks.push({name:'off',passed:true,requests:requests.length});
 } finally {await context.close();}
 report.motionV21={passed:true,browser:browser.version(),checks,referenceEvidence:'WACZ source inspection; these recordings show the theme, not a complete replay of official interactions'};
 await fs.writeFile(path.join(dir,'report.json'),JSON.stringify(report.motionV21,null,2));
 console.log('Motion v2.1: '+checks.length+' flows passed');
 return report.motionV21;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
 const out=path.resolve('.local');
 const temp=await fs.mkdtemp(path.join(out,'motion-fixtures-'));
 const servers=[];let browser;
 try {
  const sites={};
  for(const [name,options] of Object.entries({main:{},noCover:{noCover:true},disabled:{theme:{appearance:{intro:'off'}}}})) {
   const base=path.join(temp,name);await generate(base,options);const site=await serve(base);servers.push(site);sites[name]={base,...site};
  }
  browser=await chromium.launch({channel:process.env.HG_BROWSER==='chromium'?undefined:(process.env.HG_BROWSER||(process.platform==='win32'?'msedge':undefined)),headless:true});
  await checkMotionV21(browser,sites,out);
 } finally {await browser?.close();for(const server of servers)await server.close();assert.ok(path.resolve(temp).startsWith(out+path.sep+'motion-fixtures-'),'cleanup must stay in the generated fixture workspace');await fs.rm(temp,{recursive:true,force:true});}
}
