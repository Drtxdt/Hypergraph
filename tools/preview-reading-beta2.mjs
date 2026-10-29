import {serve} from './verify/fixture.mjs';
import path from 'node:path';
for(const name of ['cover','noCover']) { const s=await serve(path.resolve('.local/reading-beta2',name));console.log(name+' '+s.url+'2026/10/29/field-study/'); }
