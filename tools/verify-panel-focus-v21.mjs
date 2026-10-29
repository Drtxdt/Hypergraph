import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {generate,serve} from './verify/fixture.mjs';
const local=path.resolve('.local');await fs.mkdir(local,{recursive:true});
const generated=!process.argv[2];
const base=generated?await fs.mkdtemp(path.join(local,'focus-fixture-')):path.resolve(process.argv[2]);
if(generated)await generate(base,{few:true,theme:{appearance:{intro:'off'}}});
const site=await serve(base);
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.route('**/assets/**',async r=>{
  const url=new URL(r.request().url());const relative=url.pathname.split('/assets/')[1];
  const file=path.resolve('source/assets',relative);
  assert.ok(file.startsWith(path.resolve('source/assets')+path.sep));
  try{await r.fulfill({body:await fs.readFile(file),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':undefined});}catch{await r.continue();}
 });
 await page.goto(site.url+'2026/10/29/field-study/');
 await page.locator('[data-menu-toggle]').click();await page.locator('[data-search]').click();
 for(let i=0;i<8;i++)await page.keyboard.press('Tab');
 const before=await page.evaluate(()=>({focus:document.activeElement.outerHTML,nav:document.querySelector('#site-nav').className,visibility:getComputedStyle(document.querySelector('[data-search]')).visibility}));
 await page.keyboard.press('Escape');
 const after=await page.evaluate(()=>({focus:document.activeElement.outerHTML,nav:document.querySelector('#site-nav').className,visibility:getComputedStyle(document.querySelector('[data-search]')).visibility}));
 console.log(JSON.stringify({before,after},null,2));
 assert.ok(await page.evaluate(()=>document.activeElement.matches('[data-menu-toggle]')),'search must restore focus to the visible mobile menu trigger');
 console.log('Actual fixture mobile search focus return passed');
} finally {await browser.close();await site.close();if(generated){assert.ok(base.startsWith(local+path.sep+'focus-fixture-'));await fs.rm(base,{recursive:true,force:true});}}
