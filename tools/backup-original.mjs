import fs from "node:fs/promises";
import path from "node:path";
const source = path.resolve("D:/hexo/blog"),
  target = path.resolve(".local/backups/original-20261028");
try {
  await fs.access(target);
  throw Error("Backup already exists; refusing overwrite.");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
await fs.mkdir(target, { recursive: true });
for (const name of [
  "source",
  "_config.yml",
  "package.json",
  "package-lock.json",
  "db.json",
  "themes/arknights",
])
  await fs.cp(path.join(source, name), path.join(target, name), {
    recursive: true,
    preserveTimestamps: true,
    filter: (p) => !p.split(path.sep).includes("node_modules"),
  });
console.log("Recoverable original backup: " + target);
