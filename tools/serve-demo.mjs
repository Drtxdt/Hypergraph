import {serve} from './verify/fixture.mjs';
const server=await serve('demo');console.log(server.url);
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{await server.close();process.exit(0)});
