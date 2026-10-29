import fs from "node:fs/promises";
import path from "node:path";
const root = path.resolve(process.argv[2] || ".local/blog/public");
const issues = [];
let checked = 0;
const htmlFiles = [];
async function walk(dir) {
  for (const ent of await fs.readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, ent.name);
    if (ent.isDirectory()) await walk(file);
    else if (file.endsWith(".html")) htmlFiles.push(file);
  }
}
await walk(root);
const entities = (s) => s.replaceAll("&amp;", "&").replaceAll("&quot;", '"');
for (const file of htmlFiles) {
  const text = await fs.readFile(file, "utf8"),
    route = "/" + path.relative(root, file).replaceAll("\\", "/");
  for (const match of text.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const raw = entities(match[1]);
    if (/^(?:[a-z]+:|\/\/)/i.test(raw)) continue;
    let url;
    try {
      url = new URL(raw, "http://local" + route);
    } catch {
      issues.push({ route, raw, type: "invalid-url" });
      continue;
    }
    let target = path.resolve(root, "." + decodeURIComponent(url.pathname));
    if (!target.startsWith(root + path.sep)) continue;
    if (url.pathname.endsWith("/")) target = path.join(target, "index.html");
    try {
      await fs.access(target);
      checked++;
    } catch {
      issues.push({ route, raw, type: "missing-file" });
      continue;
    }
    if (url.hash && target.endsWith(".html")) {
      const html = target === file ? text : await fs.readFile(target, "utf8");
      const id = decodeURIComponent(url.hash.slice(1));
      if (
        !html.includes('id="' + id + '"') &&
        !html.includes("id='" + id + "'")
      )
        issues.push({ route, raw, type: "missing-anchor" });
    }
  }
}
await fs.writeFile(
  ".local/blog/link-audit.json",
  JSON.stringify({ checked, issues }, null, 2),
);
console.log({ checked, issues: issues.length, sample: issues.slice(0, 12) });
if (issues.length) process.exitCode = 1;
