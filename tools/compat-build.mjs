import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const moduleName = process.argv[2] || "hexo";
const Hexo = require(moduleName);
const base = path.resolve(".local/demo");
const hexo = new Hexo(base, { silent: true });
await hexo.init();
await hexo.call("clean");
await hexo.call("generate", { concurrency: 1 });
const posts = hexo.locals.get("posts").toArray();
assert.ok(posts.length >= 6);
assert.equal(posts.filter((p) => p.password).length, 3);
await hexo.exit();
const html = await fs.readFile(
  path.join(base, "public/2026/10/28/welcome/index.html"),
  "utf8",
);
assert.match(html, /class="katex/);
assert.match(html, /class="highlight/);
assert.match(html, /id="阅读体验"/);
assert.ok(!html.includes("{%"));
console.log(
  `${moduleName} on ${process.version}: generated ${posts.length} posts with math, highlight and anchors`,
);
