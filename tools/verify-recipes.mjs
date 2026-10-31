import fs from 'node:fs/promises';import path from 'node:path';import yaml from 'js-yaml';import assert from 'node:assert/strict';import {chromium} from 'playwright';import {generate,serve} from './verify/fixture.mjs';
const out=path.resolve('.local/beta6-recipes');await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:process.platform==='win32'?'msedge':undefined});const evidence=[];
try{for(const name of ['technical','portrait','photography']){
 const theme=yaml.load(await fs.readFile(`examples/recipes/${name}.yml`,'utf8'));
 const data=yaml.load(await fs.readFile('examples/recipes/photography-data.yml','utf8'));
 const base=path.join(out,name);await generate(base,{content:true,theme,data});const server=await serve(base);
 try{for(const width of [390,1440])for(const colorScheme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height:900},colorScheme,recordVideo:{dir:path.join(out,'videos'),size:{width,height:900}}});const page=await context.newPage();
  await page.goto(server.url);await page.waitForTimeout(2700);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const screenshot=path.join(out,`${name}-${width}-${colorScheme}.png`);await page.screenshot({path:screenshot});
  if(width===390){await page.evaluate(()=>{document.querySelector('#content').style.fontSize='200%';document.querySelector('[data-masthead-title]').style.fontSize='4rem';});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await context.close();evidence.push({name,width,colorScheme,screenshot});
 }}finally{await server.close();}
}}finally{await browser.close();await fs.writeFile(path.join(out,'report.json'),JSON.stringify(evidence,null,2));}
