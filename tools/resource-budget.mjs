import fs from "node:fs/promises";
import { gzipSync } from "node:zlib";
import assert from "node:assert/strict";
const assets = await fs.readdir("source/assets");
const initial = assets.filter(
  (name) =>
    name === "main.js" ||
    /^chunk-(Swup\.modern|index\.modern|search|optional)-/.test(name),
);
const js = (
  await Promise.all(
    initial.map(
      async (name) =>
        gzipSync(await fs.readFile("source/assets/" + name)).length,
    ),
  )
).reduce((a, b) => a + b, 0);
const css = gzipSync(await fs.readFile("source/assets/main.css")).length;
assert.ok(js <= 60 * 1024, `Initial JS ${js}`);
assert.ok(css <= 40 * 1024, `Initial CSS ${css}`);
await fs.writeFile(
  "docs/resource-budget.json",
  JSON.stringify(
    {
      initial,
      jsGzipBytes: js,
      cssGzipBytes: css,
      note: "Transfer budget only; browser performance remains a separate gate.",
    },
    null,
    2,
  ),
);
console.log({ jsGzipBytes: js, cssGzipBytes: css });
