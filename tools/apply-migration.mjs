import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import yaml from 'js-yaml';
const root = path.resolve('D:/hexo/blog');
const preview = path.resolve('.local/blog');
const staging = path.resolve('.local/migration-application');
const hash = async file => crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex');
async function files(dir) {
  const result = [];
  for (const item of await fs.readdir(dir, {withFileTypes:true})) {
    const file = path.join(dir,item.name);
    if(item.isDirectory()) result.push(...await files(file)); else result.push(file);
  }
  return result;
}
if (process.argv[2] === 'prepare') {
  await fs.mkdir(staging, {recursive:true});
  const backup = path.resolve('.local/backups', 'before-v1-' + new Date().toISOString().replace(/[:.]/g,'-'));
  await fs.mkdir(backup, {recursive:true});
  const snapshots = {};
  for (const name of ['source','_config.yml','package.json','package-lock.json','db.json','themes','_config.arknights.yml','_config.landscape.yml']) {
    const file=path.join(root,name);
    await fs.cp(file,path.join(backup,name),{recursive:true,preserveTimestamps:true,filter:p=>!p.split(path.sep).includes('node_modules')});
  }
  for(const file of [...await files(path.join(root,'source')),path.join(root,'_config.yml'),path.join(root,'package.json'),path.join(root,'package-lock.json')]) snapshots[path.relative(root,file)]=await hash(file);
  const original=yaml.load(await fs.readFile(path.join(root,'_config.yml'),'utf8'));
  const config=yaml.load(await fs.readFile(path.join(preview,'_config.yml'),'utf8'));
  config.deploy=original.deploy;
  await fs.writeFile(path.join(staging,'_config.yml'),yaml.dump(config,{lineWidth:-1}));
  const theme=yaml.load(await fs.readFile(path.join(preview,'_config.hypergraph.yml'),'utf8'));
  theme.menu={home:'/',archives:'/archives/',about:'/about/',friends:'/friend/',music:'/music/'};
  await fs.writeFile(path.join(staging,'_config.hypergraph.yml'),yaml.dump(theme));
  const pkg=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8'));
  const removed=[];
  for(const name of Object.keys(pkg.dependencies)) if(!['hexo','hexo-deployer-git','hexo-generator-archive','hexo-generator-category','hexo-generator-index','hexo-generator-tag','hexo-server'].includes(name)){removed.push(name);delete pkg.dependencies[name];}
  pkg.dependencies.hexo='7.3.0';
  pkg.dependencies['hexo-theme-hypergraph']='file:vendor/hexo-theme-hypergraph-1.0.0.tgz';
  pkg.overrides={...pkg.overrides,'markdown-it':'^14.3.3','linkify-it':'^5.0.2',yaml:'^2.8.3'};
  await fs.writeFile(path.join(staging,'package.json'),JSON.stringify(pkg,null,2));
  await fs.writeFile(path.join(staging,'manifest.json'),JSON.stringify({root,backup,snapshots,removed,status:'prepared'},null,2));
  console.log({status:'prepared',backup,files:Object.keys(snapshots).length,removedPlugins:removed.length});
} else if(process.argv[2]==='apply') {
  const manifest=JSON.parse(await fs.readFile(path.join(staging,'manifest.json'),'utf8'));
  assert.equal(root,manifest.root);
  for(const [relative,expected] of Object.entries(manifest.snapshots)) assert.equal(await hash(path.join(root,relative)),expected,'Source changed since backup: '+relative);
  const tar=path.resolve('dist/hexo-theme-hypergraph-1.0.0.tgz');
  await fs.access(tar);
  await fs.cp(path.join(preview,'source'),path.join(root,'source'),{recursive:true});
  for(const name of ['_config.yml','_config.hypergraph.yml','package.json']) await fs.copyFile(path.join(staging,name),path.join(root,name));
  await fs.mkdir(path.join(root,'vendor'),{recursive:true});
  await fs.copyFile(tar,path.join(root,'vendor/hexo-theme-hypergraph-1.0.0.tgz'));
  manifest.status='applied-awaiting-install-and-regression';
  await fs.writeFile(path.join(staging,'manifest.json'),JSON.stringify(manifest,null,2));
  console.log('Applied backed-up migration to '+root+'; deployment settings preserved.');
} else throw Error('Use prepare or apply');
