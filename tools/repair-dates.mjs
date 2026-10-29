import fs from "node:fs/promises";
import path from "node:path";
const source = path.resolve(process.argv[2] || "D:/hexo/blog");
const cached = JSON.parse(
  await fs.readFile(path.join(source, "db.json"), "utf8"),
).models.Post;
const local = (date) =>
  new Date(new Date(date).getTime() + 8 * 3600000)
    .toISOString()
    .replace("T", " ")
    .replace("Z", "");
for (const post of cached) {
  const file = path.join(".local/blog/source", post.source);
  const raw = await fs.readFile(file, "utf8");
  await fs.writeFile(
    file,
    raw.replace(/^date:.*$/m, `date: '${local(post.date)}'`),
  );
}
console.log("Restored 42 cached dates as explicit Asia/Shanghai wall times.");
