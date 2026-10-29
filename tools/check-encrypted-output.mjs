import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
let files = 0;
async function walk(dir) {
  for (const ent of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      await walk(p);
      continue;
    }
    if (!/\.(html|json|xml|txt|js)$/.test(p)) continue;
    const text = await fs.readFile(p, "utf8");
    assert.ok(
      !/PRIVATE_CANARY_(?:TEXT|CODE|NAV)_7329|fixture-password-7329/.test(text),
      `Private content leak: ${p}`,
    );
    files++;
  }
}
await walk(".local/demo/public");
console.log(
  `Scanned ${files} generated text files: no fixture body or password leaked.`,
);
