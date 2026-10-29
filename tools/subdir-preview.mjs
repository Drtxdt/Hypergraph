import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
const root = path.resolve(".local/subdir");
await fs.mkdir(root, { recursive: true });
for (const name of ["source", "themes", "package.json", "node_modules"])
  await fs.cp(path.join(".local/demo", name), path.join(root, name), {
    recursive: true,
  });
const config = yaml.load(await fs.readFile(".local/demo/_config.yml", "utf8"));
config.url = "https://example.com/blog";
config.root = "/blog/";
await fs.writeFile(path.join(root, "_config.yml"), yaml.dump(config));
console.log("Prepared /blog/ compatibility preview.");
