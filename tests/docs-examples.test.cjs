const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const yaml=require('js-yaml');const {resolveConfig}=require('../lib/config.cjs');const {normalize}=require('../lib/collections.cjs');
test('current guides and recipes use accepted configuration and structured collection examples',()=>{
 for(const file of ['docs/BETA7.md','docs/BETA7.en.md'])for(const match of fs.readFileSync(file,'utf8').matchAll(/```yaml\r?\n([\s\S]*?)```/g))assert.doesNotThrow(()=>resolveConfig(yaml.load(match[1])),file);
 for(const name of ['technical','portrait','photography'])assert.doesNotThrow(()=>resolveConfig(yaml.load(fs.readFileSync(`examples/recipes/${name}.yml`,'utf8'))));
 let checked=0;
 for(const file of ['docs/CONFIGURATION.md','docs/QUICKSTART.md'])for(const match of fs.readFileSync(file,'utf8').matchAll(/```yaml\r?\n([\s\S]*?)```/g)){
  const data=yaml.load(match[1]);for(const type of ['about','friends','gallery'])if(data?.[type]){assert.doesNotThrow(()=>normalize(type,data[type]),`${file}: ${type}`);checked++;}
 }
 assert.ok(checked>=2,'guide collection snippets must actually be tested');
});
