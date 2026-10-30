const {test}=require('node:test');
const assert=require('node:assert/strict');
const {resolveConfig}=require('../lib/config.cjs');
test('intro defaults to always and explicit off survives configuration resolution',()=>{
 assert.equal(resolveConfig({}).appearance.intro,'always');
 for(const intro of ['session','always','off']) assert.equal(resolveConfig({appearance:{intro}}).appearance.intro,intro);
 assert.throws(()=>resolveConfig({appearance:{intro:true}}),/intro/);
 assert.throws(()=>resolveConfig({appearance:{intro:'sometimes'}}),/intro/);
});
