import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const results=[];
for(const name of ['browser-resource-off','browser-reading','browser-behavior','browser-normal','browser-features','browser-comment-extras','browser-adapters','browser-integrations','browser-subdir','browser-completion']) {
  const start=Date.now();
  const run=spawnSync(process.execPath,[`tools/${name}.mjs`],{encoding:'utf8',timeout:180000});
  const result={name,passed:run.status===0,elapsedMs:Date.now()-start,output:run.stdout+run.stderr};
  results.push(result);
  console.log(name+': '+(result.passed?'PASS':'FAIL')+' '+result.output.slice(-1800));
  await fs.writeFile('.local/final-browser-suite.json',JSON.stringify(results,null,2));
}
if(results.some(r=>!r.passed))process.exitCode=1;
