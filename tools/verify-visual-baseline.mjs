import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const baseline=process.argv[2], current=process.argv[3]||'.local/verification';
if(!baseline) throw Error('Pass an explicitly reviewed baseline directory. This command never updates it.');
const old=JSON.parse(await fs.readFile(path.join(baseline,'environment.json'),'utf8'));
const now=JSON.parse(await fs.readFile(path.join(current,'report.json'),'utf8'));
assert.equal(now.browser,old.browser,'Use a baseline for this browser');
assert.equal(now.environment.platform,old.environment.platform,'Use a baseline for this platform');
if(old.fontHash) assert.equal((await fs.readFile(path.join(current,'fonts.sha256'),'utf8')).trim(),old.fontHash,'Use the reviewed fonts');
else assert.equal(now.environment.os,old.environment.os,'Use a baseline for this OS');
const browser=await chromium.launch({channel:process.platform==='win32'?'msedge':undefined});
const results=[];
await fs.mkdir(path.join(current,'diff'),{recursive:true});
try {
 const page=await browser.newPage();
 for(const file of (await fs.readdir(baseline)).filter(name=>name.endsWith('.png'))) {
  const images=await Promise.all([baseline,current].map(async dir=>'data:image/png;base64,'+(await fs.readFile(path.join(dir,file))).toString('base64')));
  const result=await page.evaluate(async images=>{
   const loaded=await Promise.all(images.map(src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src})));
   const width=Math.max(...loaded.map(i=>i.width)),height=Math.max(...loaded.map(i=>i.height));
   const pixels=loaded.map(img=>{const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);return ctx.getImageData(0,0,width,height)});
   const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
   const ctx=canvas.getContext('2d'), diff=ctx.createImageData(width,height);let count=0;
   for(let i=0;i<diff.data.length;i+=4){const changed=[0,1,2,3].some(j=>Math.abs(pixels[0].data[i+j]-pixels[1].data[i+j])>24);if(changed)count++;diff.data.set(changed?[230,40,80,255]:[pixels[1].data[i],pixels[1].data[i+1],pixels[1].data[i+2],90],i)}
   ctx.putImageData(diff,0,0);
   return {mismatch:loaded[0].width!==loaded[1].width||loaded[0].height!==loaded[1].height?1:count/(width*height),png:canvas.toDataURL()};
  },images);
  await fs.writeFile(path.join(current,'diff',file),Buffer.from(result.png.split(',')[1],'base64'));
  await fs.copyFile(path.join(baseline,file),path.join(current,'diff','baseline-'+file));
  results.push({file,mismatch:result.mismatch});
 }
 await fs.writeFile(path.join(current,'visual-diff.json'),JSON.stringify(results,null,2));
 await fs.writeFile(path.join(current,'visual-diff.html'),'<!doctype html><meta charset="utf-8"><title>Visual differences</title><style>body{font:16px system-ui}section{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}img{width:100%}h2{grid-column:1/-1}</style>'+results.map(r=>`<section><h2>${r.file}: ${(r.mismatch*100).toFixed(3)}%</h2><img alt="baseline" src="diff/baseline-${encodeURIComponent(r.file)}"><img alt="actual" src="${encodeURIComponent(r.file)}"><img alt="difference" src="diff/${encodeURIComponent(r.file)}"></section>`).join(''));
 console.log(JSON.stringify(results,null,2));
 assert.ok(results.length>0 && results.every(r=>r.mismatch<=.005),'Review visual-diff.html; baselines are never automatically accepted.');
} finally {await browser.close()}
