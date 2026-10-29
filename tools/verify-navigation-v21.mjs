import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import ts from 'typescript';
import { chromium } from 'playwright';

// An isolated fixture exercises the actual shell controller, including event order.
const source = await fs.readFile('src/modules/panels.ts', 'utf8');
const js = ts.transpileModule(source, {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const css = await fs.readFile('src/styles/navigation.css', 'utf8');
const html = `<!doctype html><html><head><style>
body{margin:0}.site-header{position:fixed;left:0;top:0;width:72px;height:100vh;background:white}.rail-open{width:240px}.site-header nav{display:flex;flex-direction:column}#content{margin-left:260px;height:100vh}.menu-toggle{display:none}.site-header nav a{padding:20px} @media(max-width:1023px){.site-header{width:100%;height:64px}.site-header nav{position:absolute;top:64px;width:100vw;height:calc(100vh - 64px)}.menu-toggle{display:inline}.rail-expand{display:none}}
${css}</style></head><body><button id="outside" style="position:absolute;left:300px">Outside</button><header class="site-header"><a class="brand" href="/">Brand</a><button data-menu-toggle class="menu-toggle" aria-expanded="false">Menu</button><nav id="site-nav"><a href="/">Home</a><details class="nav-group"><summary>Group</summary><div><a href="/two">Child</a></div></details></nav></header><main id="content" tabindex="-1"></main><footer class="site-footer"></footer><script type="module">import {mountShell} from '/panels.js';window.controller=new AbortController();mountShell(window.controller.signal);window.ready=true;</script></body></html>`;
const server=http.createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/panels.js'?'text/javascript':'text/html');res.end(req.url==='/panels.js'?js:html);});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try {
 browser=await chromium.launch({channel:process.env.HG_BROWSER==='chromium'?undefined:(process.env.HG_BROWSER||(process.platform==='win32'?'msedge':undefined)),headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 let releaseModule; const moduleGate=new Promise(resolve=>{releaseModule=resolve;});
 await page.route('**/panels.js',async route=>{await moduleGate;await route.continue();});
 await page.goto(`http://127.0.0.1:${server.address().port}`,{waitUntil:'commit'});
 await page.locator('.brand').waitFor();await page.mouse.move(30,100);releaseModule();
 await page.waitForFunction(()=>window.ready);
 await page.waitForFunction(()=>document.querySelector(".site-header").classList.contains("rail-open"));
 await page.locator('#outside').focus();
 await page.mouse.move(500,500);
 await page.mouse.move(30,100);
 await page.waitForFunction(()=>document.querySelector('.site-header').classList.contains('rail-open'));
 assert.equal(await page.locator('#outside').evaluate(e=>e===document.activeElement),true,'hover must not steal focus');
 await page.mouse.move(500,500);
 await page.waitForFunction(()=>!document.querySelector('.site-header').classList.contains('rail-open'));
 await page.mouse.move(30,100);
 await page.waitForFunction(()=>document.querySelector('.site-header').classList.contains('rail-open'));
 await page.evaluate(()=>document.dispatchEvent(new Event('hypergraph:mount')));
 assert.equal(await page.locator('.site-header').evaluate(e=>e.classList.contains('rail-open')),true,'navigation must not lock hovered rail');
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('.site-header').evaluate(e=>e.classList.contains('rail-open')),false);
 await page.mouse.move(500,500);
 await page.locator('#outside').focus();
 await page.locator('#site-nav > a').focus();
 assert.equal(await page.locator('.site-header').evaluate(e=>e.classList.contains('rail-open')),true,'focus opens rail');
 await page.locator('#outside').focus();
 await page.waitForFunction(()=>!document.querySelector('.site-header').classList.contains('rail-open'));
 for(let i=0;i<30;i++) {
  await page.mouse.move(500,500);await page.locator('#outside').focus();
  await page.waitForFunction(()=>!document.querySelector('.site-header').classList.contains('rail-open'));
  await page.mouse.move(30,100);await page.waitForFunction(()=>document.querySelector('.site-header').classList.contains('rail-open'));
  await page.evaluate(()=>document.dispatchEvent(new Event('hypergraph:mount')));
  assert.equal(await page.locator('.site-header').evaluate(e=>e.classList.contains('rail-open')),true);
 }
 await page.setViewportSize({width:390,height:844});
 await page.locator('[data-menu-toggle]').click();
 assert.equal(await page.locator('#content').evaluate(e=>e.inert),true);
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('[data-menu-toggle]').getAttribute('aria-expanded'),'false');
 assert.equal(await page.locator('[data-menu-toggle]').evaluate(e=>e===document.activeElement),true);
 assert.equal(await page.locator('#content').evaluate(e=>e.inert),false);
 await page.evaluate(()=>window.controller.abort());
 console.log('Navigation v2.1: hover, no focus theft, delayed close, navigation reconciliation, Escape, focus, mobile inert and focus return passed.');
} finally { await browser?.close();await new Promise(resolve=>server.close(resolve)); }
