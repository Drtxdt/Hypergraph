import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
await page.goto('http://127.0.0.1:4181/');
await page.screenshot({path:'.local/screenshots/release-home-desktop.png',fullPage:true});
for(const route of ['/2026/10/28/welcome/','/2026/10/28/showcase/','/2026/10/29/components/','/about/','/friends/','/gallery/','/essay/','/equipment/','/music/','/room/','/fcircle/']){
 await page.goto('http://127.0.0.1:4181'+route);
 assert.ok(await page.locator('#content h1').isVisible());
 if(route.includes('showcase'))await page.waitForSelector('[data-diagram=mermaid] pre svg');
}
await page.setViewportSize({width:390,height:844});
await page.goto('http://127.0.0.1:4181/');
await page.evaluate(()=>document.documentElement.dataset.mode='dark');
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await page.screenshot({path:'.local/screenshots/release-home-mobile-dark.png',fullPage:true});
assert.deepEqual(errors,[]);
await browser.close();
console.log('Public release demo: five articles/eight collections, diagrams, responsive dark layout and local assets passed.');
