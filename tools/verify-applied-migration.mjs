import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import yaml from "js-yaml";
import fm from "hexo-front-matter";
const stateFile = ".local/migration-application/manifest.json";
const state = JSON.parse(await fs.readFile(stateFile, "utf8"));
const root = state.root,
  original = state.backup;
const before = JSON.parse(
  await fs.readFile(path.join(original, "db.json"), "utf8"),
).models.Post;
const after = JSON.parse(await fs.readFile(path.join(root, "db.json"), "utf8"))
  .models.Post;
assert.equal(after.length, 43);
let cached = 0;
for (const post of after) {
  const old = fm.parse(
    (
      await fs.readFile(path.join(original, "source", post.source), "utf8")
    ).replace(/\r\n/g, "\n"),
  );
  const current = fm.parse(
    (await fs.readFile(path.join(root, "source", post.source), "utf8")).replace(
      /\r\n/g,
      "\n",
    ),
  );
  assert.equal(current._content, old._content, post.source + " body");
  assert.equal(current.password, undefined);
  assert.deepEqual(current.tags, old.tags);
  assert.deepEqual(current.categories, old.categories);
  const prev = before.find((p) => p.source === post.source);
  if (prev) {
    assert.equal(
      new Date(prev.date).toISOString(),
      new Date(post.date).toISOString(),
    );
    assert.equal(post.slug, prev.slug);
    cached++;
  }
}
const hash = async (f) =>
  crypto
    .createHash("sha256")
    .update(await fs.readFile(f))
    .digest("hex");
assert.equal(
  await hash(path.join(original, "themes/arknights/source/audio/bgm.mp3")),
  await hash(path.join(root, "source/audio/bgm.mp3")),
);
const cfg = yaml.load(
  await fs.readFile(path.join(root, "_config.yml"), "utf8"),
);
assert.equal(cfg.theme, "hypergraph");
assert.equal(cfg.url, "https://suzuranloveapple.me");
assert.deepEqual(
  cfg.deploy,
  yaml.load(await fs.readFile(path.join(original, "_config.yml"), "utf8"))
    .deploy,
);
const pkg = JSON.parse(
  await fs.readFile(
    path.join(root, "node_modules/hexo-theme-hypergraph/package.json"),
    "utf8",
  ),
);
assert.equal(pkg.version, "1.0.0");
const oldPaths = JSON.parse(
  await fs.readFile(".local/blog/link-report.json", "utf8"),
);
// Actual output paths were verified against the old cache in verify-links; compare all migrated HTML paths.
async function compare(dir) {
  for (const ent of await fs.readdir(dir, { withFileTypes: true })) {
    const f = path.join(dir, ent.name);
    if (ent.isDirectory()) await compare(f);
    else if (ent.name.endsWith(".html"))
      await fs.access(
        path.join(
          root,
          "public",
          path.relative(path.resolve(".local/blog/public"), f),
        ),
      );
  }
}
await compare(path.resolve(".local/blog/public"));
state.status = "verified";
state.verified = {
  posts: after.length,
  cachedDates: cached,
  bodyAndTaxonomy: true,
  audio: true,
  deploymentPreserved: true,
  themeVersion: pkg.version,
  at: new Date().toISOString(),
};
await fs.writeFile(stateFile, JSON.stringify(state, null, 2));
console.log(state.verified);
