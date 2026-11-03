import fs from 'node:fs/promises';
import path from 'node:path';
const dir=process.argv[2] || '.local/verification';
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for (const kind of ['wordmark','photo']) for (const width of [390,1440]) for (const mode of ['light','dark']) {
  const name=`${kind}-${width}-${mode}-100.png`;
  try {await fs.copyFile(path.join('.local/beta8',name),path.join(dir,name));} catch(error) {if(error.code!=='ENOENT')throw error;}
}
try {await fs.copyFile('.local/beta8/article-screen-3.png',path.join(dir,'article-screen-3.png'));} catch(error) {if(error.code!=='ENOENT')throw error;}
const files=(await fs.readdir(dir)).filter(name=>name.endsWith('.png')).sort();
const report=JSON.parse(await fs.readFile(path.join(dir,'report.json'),'utf8'));
await fs.writeFile(path.join(dir,'visual-report.html'),`<!doctype html><meta charset="utf-8"><title>Hypergraph visual evidence</title><style>body{font:16px system-ui;margin:32px;background:#eee;color:#222}section{margin:32px 0}img{max-width:100%;height:auto}pre{white-space:pre-wrap}</style><h1>Hypergraph visual evidence</h1><pre>${escape(JSON.stringify({browser:report.browser,environment:report.environment},null,2))}</pre>${files.map(file=>`<section><h2>${escape(file)}</h2><a href="${encodeURIComponent(file)}"><img loading="lazy" src="${encodeURIComponent(file)}" alt="${escape(file)}"></a></section>`).join('')}`);
console.log(`Visual report: ${files.length} screenshots; baseline acceptance is a separate reviewed operation.`);
