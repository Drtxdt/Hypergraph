import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const root=path.resolve('.local/release/Hypergraph-v1.0.0');
if(!root.startsWith(path.resolve('.local/release')+path.sep))throw Error('Unsafe release staging');
await fs.rm(root,{recursive:true,force:true});
await fs.mkdir(root,{recursive:true});
const names=['layout','scripts','lib','source','src','tools','tests','examples','vendor','docs','deploy','_config.yml','config.schema.json','package.json','package-lock.json','tsconfig.json','vite.config.mjs','README.md','README.en.md','LICENSE','THIRD-PARTY-NOTICES.md'];
for(const name of names) await fs.cp(name,path.join(root,name),{recursive:true,filter:p=>!p.split(path.sep).includes('node_modules')});
await fs.cp('demo',path.join(root,'demo'),{recursive:true,filter:p=>!p.split(path.sep).includes('node_modules')&&!p.endsWith('db.json')});
await fs.mkdir(path.join(root,'dist'),{recursive:true});
await fs.copyFile('dist/hexo-theme-hypergraph-1.0.0.tgz',path.join(root,'dist/hexo-theme-hypergraph-1.0.0.tgz'));
const tar=await fs.readFile('dist/hexo-theme-hypergraph-1.0.0.tgz');
const integrity='sha512-'+crypto.createHash('sha512').update(tar).digest('base64');
for(const site of ['demo','.local/install-v1','D:/hexo/blog']){
 const lock=JSON.parse(await fs.readFile(path.join(site,'package-lock.json'),'utf8'));
 assert.equal(lock.packages['node_modules/hexo-theme-hypergraph'].integrity,integrity,site+' lock integrity');
}
const suite=JSON.parse(await fs.readFile('.local/final-browser-suite.json','utf8'));
assert.ok(suite.every(x=>x.passed));
const migration=JSON.parse(await fs.readFile('.local/migration-application/manifest.json','utf8'));
assert.equal(migration.status,'verified');
const inventory=JSON.parse(await fs.readFile('.local/package-inventory.json','utf8'))[0];
const info={version:'1.0.0',themeBytes:tar.length,themeFiles:inventory.files.length,sha256:crypto.createHash('sha256').update(tar).digest('hex'),browserSuite:suite.map(({name,passed})=>({name,passed})),migration:{posts:43,oldPaths:42,verified:true},demo:{posts:5,collections:8},performance:JSON.parse(await fs.readFile('.local/performance.json','utf8')).results.map(({run,route,lcp,cls,maxInteractionMs})=>({run,page:route==='/'?'home':'long-article',lcp,cls,maxInteractionMs}))};
await fs.writeFile('dist/release-manifest.json',JSON.stringify(info,null,2));
await fs.copyFile('dist/release-manifest.json',path.join(root,'release-manifest.json'));
console.log({staging:root,themeIntegrityVerified:true,browserSuitePassed:suite.length});
