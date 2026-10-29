import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {serve} from './verify/fixture.mjs';
const server=await serve(path.resolve('.local/reading-beta2/cover'));
const browser=await chromium.launch({channel:'msedge'});
try {
 const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(server.url+'2026/10/29/field-study/',{waitUntil:'networkidle'});
 assert.equal(await page.locator('.post-credit').count(),0);
 assert.ok(await page.locator('.toc-panel').evaluate(e=>e.getBoundingClientRect().width>=250));
 assert.equal(await page.locator('.site-header nav>a').first().evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');
 const links=page.locator('.toc a');
 for(const index of [3,0,2,1,3,0]) {const link=links.nth(index);await link.click();assert.equal(await link.getAttribute('aria-current'),'location');assert.equal(await page.locator('.toc a[aria-current=location]').count(),1);}
 await page.locator('.copy-table').click();const table=await page.evaluate(()=>navigator.clipboard.readText());assert.ok(table.includes('层次\t作用\t阅读方式'));
 assert.equal(await page.locator('.copy-table').count(),1);
 await page.locator('.copy-code').click();const code=await page.evaluate(()=>navigator.clipboard.readText());assert.ok(code.includes('const journal'));assert.ok(!code.includes('复制'));
 assert.ok((await page.locator('.post-tags a').first().evaluate(e=>getComputedStyle(e).backgroundImage)).includes('repeating-linear-gradient'));
 await page.screenshot({path:'.local/reading-beta2/code-table.png'});
 await page.goto(server.url+'2026/10/19/private-plain/',{waitUntil:'networkidle'});
 const key=page.locator('[data-unlock] input');const eye=page.locator('[data-key-visibility]');
 assert.ok((await page.locator('[data-unlock] label').textContent()).includes('请输入协议密钥'));
 await key.fill('sample-key');await eye.click();assert.equal(await key.getAttribute('type'),'text');assert.equal(await key.inputValue(),'sample-key');assert.equal(await eye.getAttribute('aria-pressed'),'true');
 await eye.click();assert.equal(await key.getAttribute('type'),'password');assert.equal(await page.locator('[data-unlock]').count(),1);
 await page.screenshot({path:'.local/reading-beta2/unlock.png'});
 await page.locator('[data-unlock] input').fill('wrong');await page.locator('[data-unlock] button[type=submit]').click();await page.waitForFunction(()=>document.querySelector('[data-unlock] [role=status]').textContent.includes('密码错误'));
 assert.equal(await key.getAttribute('aria-invalid'),'true');
 await page.locator('[data-unlock] input').fill('fixture-password-7329');await page.locator('[data-unlock] button[type=submit]').click();await page.locator('[data-unlock]').waitFor({state:'detached'});
 assert.ok((await page.locator('[data-plaintext]').textContent()).includes('PRIVATE_CANARY_plain_7329'));assert.deepEqual(errors,[]);
 await fs.writeFile('.local/reading-beta2/reading-controls-report.json',JSON.stringify({passed:true,tocRapidClicks:6,tableCopy:true,codeCopy:true,decryption:true,errors},null,2));console.log('TOC, code/table copy, tags, password error and unlock passed');
}finally{await browser.close();await server.close();}
