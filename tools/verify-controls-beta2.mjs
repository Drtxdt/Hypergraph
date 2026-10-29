import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {serve} from './verify/fixture.mjs';
const server=await serve(path.resolve('.local/reading-beta2/cover'));
const browser=await chromium.launch({channel:'msedge'});const results=[];
try {for(const width of [1440,390]) {
 const context=await browser.newContext({viewport:{width,height:900},permissions:['clipboard-read','clipboard-write']});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(server.url+'2026/10/29/field-study/',{waitUntil:'networkidle'});
 const reading=page.locator('[data-reading]');assert.equal(await reading.locator('svg').count(),1);assert.ok(await reading.getAttribute('aria-label'));
 if(width===1440)assert.equal(await page.locator('[data-menu-toggle]').isVisible(),false);
 await reading.hover();await page.waitForTimeout(300);assert.equal(await reading.evaluate(e=>getComputedStyle(e,'::before').transform),'matrix(1, 0, 0, 1, 0, 0)');
 await page.locator('[data-copy-share][data-platform=bilibili]').click();assert.ok((await page.evaluate(()=>navigator.clipboard.readText())).includes('field-study'));
 assert.equal(await page.locator('[data-copy-share][data-platform=instagram] svg').count(),1);
 assert.ok((await page.locator('.post-actions a[aria-label=x]').getAttribute('href')).includes('/intent/tweet'));
 await page.screenshot({path:`.local/reading-beta2/actions-${width}.png`});
 if(width===390)await page.locator('[data-menu-toggle]').click();else {await page.mouse.move(30,200);await page.waitForTimeout(300);}
 await page.locator('[data-search]').click();assert.equal(await page.locator('#search-input').evaluate(e=>e===document.activeElement),true);
 await page.locator('#search-input').fill('Hypergraph');await page.locator('[data-results] li').first().waitFor();
 assert.equal(await page.locator('[data-search-pagination]').first().isVisible(),false);
 await page.screenshot({path:`.local/reading-beta2/search-${width}.png`});
 await page.keyboard.press('Escape');assert.equal(await page.locator('#search-dialog').evaluate(e=>e.open),false);assert.deepEqual(errors,[]);
 results.push({width,icons:true,copy:true,search:true,hover:true,errors});await context.close();
}
await fs.writeFile('.local/reading-beta2/controls-report.json',JSON.stringify({passed:true,results},null,2));console.log(results);
}finally{await browser.close();await server.close();}
