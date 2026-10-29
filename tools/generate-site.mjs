import path from "node:path";
import fs from "node:fs/promises";
import Hexo from "hexo";
const base = path.resolve(process.argv[2] || ".local/blog");
if (!base.startsWith(path.resolve(".local") + path.sep))
  throw Error("Validation sites must be inside .local");
const hexo = new Hexo(base, { silent: true });
const errors = [];
hexo.log.on?.("error", (message) => errors.push(message));
await hexo.init();
await hexo.call("clean");
await hexo.call("generate", { concurrency: 1 });
await hexo.exit();
if (errors.length) throw Error(errors.join("\n"));
const home = await fs.readFile(path.join(base, "public/index.html"), "utf8");
if (!home.includes('id="content"') || !home.includes("hg-config"))
  throw Error("Missing rendered theme");
console.log("Generated " + base);
