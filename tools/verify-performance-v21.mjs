import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {generate,serve} from './verify/fixture.mjs';
import {performance} from './verify/browser.mjs';
const root=path.resolve('.local/performance-v21');
const sites={},servers=[];let browser;
try {
 for(const [name,options] of Object.entries({main:{},noCover:{noCover:true}})) {
  const base=path.join(root,name);await generate(base,options);const server=await serve(base);servers.push(server);sites[name]={base,...server};
 }
 browser=await chromium.launch({channel:process.platform==='win32'?'msedge':undefined});
 const report={date:new Date().toISOString(),passed:false};
 try {await performance(browser,sites,report);report.passed=true;}
 finally {await fs.writeFile(path.join(root,'report.json'),JSON.stringify(report,null,2));}
 console.log('Performance v2.1 passed');
} finally {await browser?.close();for(const server of servers)await server.close();}
