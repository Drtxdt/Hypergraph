import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext();const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const checks=[];const dir='.local/screenshots/endfield';await fs.mkdir(dir,{recursive:true});
for(const variant of ['no-cover','few','empty'])await page.route('**/?variant='+variant,async route=>route.fulfill({contentType:'text/html',body:await fs.readFile('.local/endfield-'+variant+'/public/index.html','utf8')}));
for(const width of [360,390,768,1440])for(const mode of ['light','dark'])for(const view of ['home','article','no-cover','few','empty']){
 await page.setViewportSize({width,height:width===1440?1000:844});
 await page.goto('http://127.0.0.1:4183/'+(view==='article'?'2026/10/29/field-study/':view==='home'?'':'?variant='+view));
 await page.evaluate(mode=>{document.documentElement.dataset.mode=mode;return document.fonts.ready;},mode);
 await page.waitForTimeout(180);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),view+' '+width+' overflow');
 if(view==='home'||view==='no-cover') {assert.equal(await page.locator('.lead').count(),1);assert.equal(await page.locator('.entry').count(),5);}
 if(view==='no-cover')assert.equal(await page.locator('.lead img').count(),0);
 if(view==='few')assert.equal(await page.locator('.entry').count(),0);
 if(view==='empty')assert.equal(await page.locator('.empty-state').count(),1);
 if(width===390||width===1440)await page.screenshot({path:dir+'/'+view+'-'+width+'-'+mode+'.png',fullPage:false});
 checks.push({width,mode,view,overflow:false});
}
await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:4183/');
await page.waitForFunction(()=>document.documentElement.style.getPropertyValue('--player-space')!=='');
assert.ok(await page.locator('.player').isVisible());
await page.evaluate(()=>{window.originalAudio=document.querySelector('.player audio');window.originalAudio.loop=true;return window.originalAudio.play();});
await page.locator('[data-player-close]').click();assert.equal(await page.locator('.player').isVisible(),false);
assert.equal(await page.evaluate(()=>window.originalAudio.paused),false);
await page.locator('.lead-link').click();await page.waitForURL('**/field-study/');
assert.ok(await page.evaluate(()=>window.originalAudio===document.querySelector('.player audio')));
await page.waitForFunction(()=>{const details=document.querySelector('.toc-panel details');return details&&!details.hasAttribute('open');});
assert.equal(await page.locator('.toc-panel details').getAttribute('open'),null);
await page.locator('[data-menu-toggle]').click();await page.keyboard.press('Escape');assert.equal(await page.locator('[data-menu-toggle]').getAttribute('aria-expanded'),'false');
await page.locator('[data-menu-toggle]').click();await page.locator('[data-player-toggle]').click();await page.locator('[data-player-close]').click();await page.keyboard.press('Escape');
assert.equal(await page.evaluate(()=>window.originalAudio.paused),false);
await page.evaluate(()=>window.originalAudio.pause());
for(const width of [390,1440])for(const mode of ['light','dark']){
 await page.setViewportSize({width,height:width===1440?1000:844});await page.goto('http://127.0.0.1:4184/');await page.evaluate(mode=>{document.documentElement.dataset.mode=mode;return document.fonts.ready;},mode);await page.screenshot({path:dir+'/before-home-'+width+'-'+mode+'.png'});
}
assert.deepEqual(errors,[]);
await fs.writeFile(dir+'/checks.json',JSON.stringify({browser:browser.version(),date:new Date().toISOString(),checks,assertions:['overflow','single lead','no duplicate featured','no-cover','empty and one-post','mobile music space','same audio after navigation','playback while collapsed','mobile TOC','menu Escape'],visualApproval:'pending'},null,2));
await browser.close();console.log(checks.length+' viewport checks passed; visual approval pending');
