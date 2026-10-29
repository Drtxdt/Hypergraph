import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fm from "hexo-front-matter";
const source = path.resolve(process.argv[2] || "D:/hexo/blog");
const target = path.resolve(".local/blog");
const oldDB = JSON.parse(
  await fs.readFile(path.join(source, "db.json"), "utf8"),
).models.Post;
const newDB = JSON.parse(
  await fs.readFile(path.join(target, "db.json"), "utf8"),
).models.Post;
const report = [];
const hash = (body) => crypto.createHash("sha256").update(body).digest("hex");
async function walk(dir) {
  for (const ent of await fs.readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      await walk(file);
      continue;
    }
    if (!file.endsWith(".md")) continue;
    const relative = path.relative(path.join(source, "source"), file);
    const old = fm.parse(
      (await fs.readFile(file, "utf8")).replace(/\r\n/g, "\n"),
    );
    const updated = fm.parse(
      (
        await fs.readFile(path.join(target, "source", relative), "utf8")
      ).replace(/\r\n/g, "\n"),
    );
    assert.equal(updated._content, old._content, `Body changed: ${relative}`);
    assert.equal(updated.password, undefined, `Password remains: ${relative}`);
    assert.deepEqual(updated.tags, old.tags, `Tags changed: ${relative}`);
    assert.deepEqual(
      updated.categories,
      old.categories,
      `Categories changed: ${relative}`,
    );
    const key = relative.replaceAll("\\", "/");
    const cached = oldDB.find((p) => p.source === key),
      current = newDB.find((p) => p.source === key);
    assert.ok(current, `Missing generated article ${key}`);
    if (cached) {
      assert.equal(
        new Date(current.date).toISOString(),
        new Date(cached.date).toISOString(),
        `Date changed: ${key}`,
      );
      assert.equal(current.slug, cached.slug, `Slug changed: ${key}`);
    }
    report.push({
      source: key,
      bodySha256: hash(old._content),
      bodyUnchanged: true,
      wasEncrypted: !!old.password,
      previouslyPublished: !!cached,
      date: new Date(current.date).toISOString(),
      slug: current.slug,
    });
  }
}
await walk(path.join(source, "source/_posts"));
assert.equal(report.length, 43);
assert.equal(report.filter((p) => p.previouslyPublished).length, 42);
const audio = await fs.readFile(path.join(target, "source/audio/bgm.mp3"));
assert.deepEqual(
  audio,
  await fs.readFile(path.join(source, "themes/arknights/source/audio/bgm.mp3")),
);
await fs.writeFile(
  path.join(target, "verification-report.json"),
  JSON.stringify(
    {
      verifiedAt: new Date().toISOString(),
      posts: report.length,
      existing: 42,
      new: 1,
      audioSha256: hash(audio),
      articles: report,
    },
    null,
    2,
  ),
);
console.log(
  "Verified all 43 bodies, tags, categories; 42 cached dates/slugs; original audio.",
);
