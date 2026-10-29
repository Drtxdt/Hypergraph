import fs from 'node:fs/promises';
import path from 'node:path';
const manifest=JSON.parse(await fs.readFile('.local/migration-application/manifest.json','utf8'));
const root=path.resolve(manifest.root),backup=path.resolve(manifest.backup);
if(root!==path.resolve('D:/hexo/blog') || !backup.startsWith(path.resolve('.local/backups')+path.sep))throw Error('Unexpected rollback paths');
for(const file of ['source','_config.yml','package.json','package-lock.json','db.json'])await fs.access(path.join(backup,file));
if(process.argv[2]!=='--apply'){
 console.log({mode:'dry-run',root,backup,next:'Run with --apply only when rollback is intended, then npm ci and hexo generate.'});
} else {
 const saved=path.resolve('.local/backups','before-rollback-'+Date.now());
 await fs.mkdir(saved,{recursive:true});
 for(const name of ['source','_config.yml','_config.hypergraph.yml','package.json','package-lock.json','db.json'])await fs.cp(path.join(root,name),path.join(saved,name),{recursive:true});
 const target=path.resolve(root,'source');
 if(target!==path.join(root,'source') || !target.startsWith(root+path.sep))throw Error('Unsafe source restore');
 await fs.rm(target,{recursive:true});
 for(const name of ['source','_config.yml','package.json','package-lock.json','db.json','themes','_config.arknights.yml','_config.landscape.yml'])await fs.cp(path.join(backup,name),path.join(root,name),{recursive:true});
 console.log('Restored original source/config/lock/cache. Newer files retained at '+saved+'. Run npm ci and hexo clean/generate.');
}
