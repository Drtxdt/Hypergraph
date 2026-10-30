import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const fm = require('hexo-front-matter');
const root = path.resolve(process.argv[2] || 'demo/source/_posts');
const result = [];
async function walk(directory) {
  for (const entry of await fs.readdir(directory, {withFileTypes:true})) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { await walk(file); continue; }
    if (!file.endsWith('.md')) continue;
    const post = fm.parse(await fs.readFile(file,'utf8'));
    if (post.cover || post.banner || post.password || post.encrypt) continue;
    const excerpt = String(post._content || '').split(/<!--\s*more\s*-->/i)[0];
    const candidates = [...excerpt.matchAll(/!\[[^\]]*\]\(([^\s)]+)(?:\s+[^)]*)?\)|<img\b[^>]*\bsrc=["']([^"']+)["']/gi)].map(match=>match[1]||match[2]);
    if (candidates.length) result.push({source:path.relative(root,file).replaceAll('\\','/'),title:post.title,candidates:[...new Set(candidates)],applied:false});
  }
}
await walk(root);
console.log(JSON.stringify(result,null,2));
