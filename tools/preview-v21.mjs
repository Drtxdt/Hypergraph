import {generate,serve} from './verify/fixture.mjs';
const base=new URL('../.local/preview-v21/',import.meta.url);
const {fileURLToPath}=await import('node:url');
const directory=fileURLToPath(base);
await generate(directory);
const server=await serve(directory);
console.log(server.url);
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{await server.close();process.exit(0)});
