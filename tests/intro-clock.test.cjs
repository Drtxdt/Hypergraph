const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const bootstrap=require('../lib/intro-bootstrap.cjs');
function fixture(started=100){
 let now=started,id=0;const timers=new Map(),frames=new Map(),events=[],classes=new Set();
 const control={style:{setProperty(){}},addEventListener(){},removeEventListener(){},textContent:''};
 const host={hidden:true,dataset:{},style:{setProperty(){}},classList:{add(){}},querySelector:()=>control};
 const window={};
 vm.runInNewContext(`(${bootstrap.toString()})('always','test')`,{
  window,document:{hidden:false,querySelector:selector=>selector==='[data-intro]'?host:null,documentElement:{classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)}},addEventListener(){},removeEventListener(){},dispatchEvent:event=>events.push(event.type)},
  navigator:{},location:{hash:''},matchMedia:()=>({matches:false}),performance:{now:()=>now,getEntriesByType:()=>[{type:'navigate'}]},AbortController,CustomEvent,Event,
  setTimeout:(fn,delay)=>{const key=++id;timers.set(key,{fn,delay});return key;},clearTimeout:key=>timers.delete(key),
  requestAnimationFrame:fn=>{const key=++id;frames.set(key,fn);return key;},cancelAnimationFrame:key=>frames.delete(key)
 });
 return {window,host,timers,frames,events,classes,setTime:value=>now=value};
}
test('normal completion clock ends on time even without a final animation frame, exactly once',()=>{
 const f=fixture();const deadline=[...f.timers.values()].find(t=>t.delay===2300);const watchdog=[...f.timers.values()].find(t=>t.delay===3950);
 assert.ok(deadline);const frame=[...f.frames.values()][0];f.setTime(1560);frame(1560);
 f.setTime(2400);deadline.fn();watchdog.fn();f.window.__hgIntroFinish('skip');
 assert.equal(f.host.hidden,true);assert.equal(f.classes.has('intro-active'),false);assert.equal(f.window.__hgIntroResult.reason,'complete');assert.equal(f.window.__hgIntroResult.ended,2400);assert.equal(f.events.filter(x=>x==='hypergraph:intro-end').length,1);assert.equal(f.timers.size,0);
});
test('bootstrap arriving beyond the normal budget records degradation rather than full playback',()=>{
 const f=fixture(2500);const deadline=[...f.timers.values()].find(t=>t.delay===0);assert.ok(deadline);deadline.fn();
 assert.equal(f.window.__hgIntroResult.reason,'timeline-budget');assert.equal(f.events.filter(x=>x==='hypergraph:intro-end').length,1);
});
