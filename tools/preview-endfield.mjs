import fs from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import Hexo from 'hexo';
const variant=process.argv[2]||'default';
if(!['default','no-cover','few','empty'].includes(variant))throw Error('Unknown variant');
const root=path.resolve('.local/endfield'+(variant==='default'?'':'-'+variant));
await fs.mkdir(root,{recursive:true});
await fs.cp('demo/source',path.join(root,'source'),{recursive:true});
await fs.cp('examples/visual/source',path.join(root,'source'),{recursive:true});
const postRoot=path.join(root,'source/_posts');
if(variant==='empty'||variant==='few')for(const name of await fs.readdir(postRoot)){if(variant==='empty'||name!=='field-study.md')await fs.unlink(path.join(postRoot,name));}
if(variant==='no-cover'){const file=path.join(postRoot,'field-study.md');let text=await fs.readFile(file,'utf8');text=text.replace(/^cover:.*$/m,'').replace(/^title:.*$/m,'title: 在复杂而不断变化的世界里，我们如何为长期写作建立一个清晰、安静并且可以持续生长的数字空间');await fs.writeFile(file,text);}
await fs.copyFile('demo/_config.yml',path.join(root,'_config.yml'));
const config=yaml.load(await fs.readFile('demo/_config.hypergraph.yml','utf8'));
config.preset='endfield';config.sidebar={enable:false};
config.menu=[{label:'home',url:'/',icon:'home'},{label:'archives',url:'/archives/',icon:'archive'},{label:'关于',url:'/about/',icon:'about'}];
await fs.writeFile(path.join(root,'_config.hypergraph.yml'),yaml.dump(config));
const pkg=JSON.parse(await fs.readFile('demo/package.json','utf8'));delete pkg.dependencies['hexo-theme-hypergraph'];
await fs.writeFile(path.join(root,'package.json'),JSON.stringify(pkg));
for(const name of ['hexo-generator-index','hexo-generator-archive','hexo-generator-tag','hexo-generator-category','hexo-pagination']) await fs.cp(path.join('demo/node_modules',name),path.join(root,'node_modules',name),{recursive:true});
for(const name of ['layout','scripts','source','lib','config.schema.json','_config.yml'])await fs.cp(name,path.join(root,'themes/hypergraph',name),{recursive:true});
const hexo=new Hexo(root,{silent:false});await hexo.init();await hexo.call('generate');
const html=await fs.readFile(path.join(root,'public/index.html'),'utf8');
if(!html.includes(variant==='empty'?'empty-state':'class="lead'))throw Error('Missing rendered preview');
await hexo.exit();console.log('Visual preview generated at '+root);
