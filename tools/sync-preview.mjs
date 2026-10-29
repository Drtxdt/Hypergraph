import fs from "node:fs/promises";
import path from "node:path";
const target = path.resolve(process.argv[2] || ".local/blog");
if (!target.startsWith(path.resolve(".local") + path.sep))
  throw Error("Preview must be inside .local");
const themeRoot = path.join(target, "themes/hypergraph");
for (const name of [
  "layout",
  "scripts",
  "source",
  "lib",
  "config.schema.json",
  "_config.yml",
]) {
  const destination = path.resolve(themeRoot, name);
  if (!destination.startsWith(themeRoot + path.sep))
    throw Error("Unsafe preview path");
  await fs.rm(destination, { recursive: true, force: true });
  await fs.cp(name, destination, { recursive: true });
}
console.log("Updated theme in " + target);
