import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
const oldRoot = "D:/hexo/blog";
const posts = JSON.parse(
  await fs.readFile(path.join(oldRoot, "db.json"), "utf8"),
).models.Post;
const result = [];
for (const post of posts) {
  const date = new Date(new Date(post.date).getTime() + 8 * 3600000)
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "/");
  const route = date + "/" + post.slug + "/index.html";
  await fs.access(path.join(oldRoot, "public", route));
  await fs.access(path.join(".local/blog/public", route));
  result.push({
    source: post.source,
    old: route,
    current: route,
    unchanged: true,
  });
}
assert.equal(result.length, 42);
await fs.writeFile(
  ".local/blog/link-report.json",
  JSON.stringify(result, null, 2),
);
console.log("All 42 original generated article paths exist unchanged.");
