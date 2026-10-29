import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const source = path.resolve(process.argv[2] || "D:/hexo/blog");
const target = path.resolve(".local/blog");
const yaml = require("js-yaml");
const fm = require("hexo-front-matter");
try {
  await fs.access(target);
  throw new Error("迁移目标已存在，拒绝覆盖：" + target);
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
await fs.mkdir(target, { recursive: true });
const backup = path.resolve(
  ".local/backups",
  new Date().toISOString().replace(/[:.]/g, "-"),
);
await fs.mkdir(backup, { recursive: true });
for (const name of [
  "source",
  "_config.yml",
  "package.json",
  "package-lock.json",
  "db.json",
])
  await fs.cp(path.join(source, name), path.join(backup, name), {
    recursive: true,
    preserveTimestamps: true,
  });
await fs.cp(
  path.join(source, "themes/arknights"),
  path.join(backup, "themes/arknights"),
  {
    recursive: true,
    preserveTimestamps: true,
    filter: (src) => !src.split(path.sep).includes("node_modules"),
  },
);
await fs.cp(path.join(source, "source"), path.join(target, "source"), {
  recursive: true,
  preserveTimestamps: true,
});
const originalConfig = yaml.load(
  await fs.readFile(path.join(source, "_config.yml"), "utf8"),
);
const cached = JSON.parse(
  await fs.readFile(path.join(source, "db.json"), "utf8"),
).models.Post;
const report = [];
async function walk(dir) {
  for (const ent of await fs.readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      await walk(file);
      continue;
    }
    if (!file.endsWith(".md")) continue;
    const raw = await fs.readFile(file, "utf8");
    const data = fm.parse(raw.replace(/\r\n/g, "\n"));
    const body = data._content;
    const relative = path
      .relative(path.join(target, "source"), file)
      .replaceAll("\\", "/");
    const encrypted = Boolean(data.password);
    for (const key of [
      "_content",
      "password",
      "encrypt",
      "message",
      "wrong_pass_message",
      "wrong_hash_message",
    ])
      delete data[key];
    if (encrypted) delete data.abstract;
    const old = cached.find((p) => p.source === relative);
    if (old)
      data.date = new Date(new Date(old.date).getTime() + 8 * 3600000)
        .toISOString()
        .replace("T", " ")
        .replace("Z", "");
    const output =
      "---\n" + yaml.dump(data, { lineWidth: -1 }) + "---\n" + body;
    if (fm.parse(output)._content !== body)
      throw Error("Body changed: " + relative);
    await fs.writeFile(file, output);
    report.push({
      source: relative,
      removedEncryption: encrypted,
      bodyUnchanged: true,
    });
  }
}
await walk(path.join(target, "source/_posts"));
const config = {
  ...originalConfig,
  url: "https://suzuranloveapple.me",
  language: "zh-CN",
  timezone: "Asia/Shanghai",
  theme: path.resolve(".").replaceAll("\\", "/"),
  deploy: {},
  highlight: { enable: true, line_number: true },
  markdown: {
    render: { html: true, breaks: false, linkify: true, typographer: false },
    images: { prepend_root: true, post_asset: true },
  },
};
config.theme = "hypergraph";
config.index_generator = { ...config.index_generator, order_by: "-date" };
await fs.mkdir(path.join(target, "themes"), { recursive: true });
for (const name of [
  "layout",
  "scripts",
  "source",
  "lib",
  "config.schema.json",
  "_config.yml",
  "package.json",
])
  await fs.cp(
    path.resolve(name),
    path.join(target, "themes/hypergraph", name),
    { recursive: true },
  );
delete config.encrypt;
delete config.search;
delete config.mathjax;
delete config.katex;
await fs.writeFile(
  path.join(target, "_config.yml"),
  yaml.dump(config, { lineWidth: -1 }),
);
await fs.writeFile(
  path.join(target, "_config.hypergraph.yml"),
  yaml.dump({
    music: { enable: true, src: "/audio/bgm.mp3", title: "背景音乐" },
  }),
);
await fs.writeFile(
  path.join(target, "package.json"),
  JSON.stringify(
    {
      name: "hypergraph-migration-preview",
      private: true,
      hexo: { version: "7.3.0" },
      dependencies: {
        hexo: "7.3.0",
        "hexo-theme-hypergraph": "file:" + path.resolve("dist/hexo-theme-hypergraph-1.0.0.tgz").replaceAll("\\", "/"),
        "hexo-generator-index": "^4.0.0",
        "hexo-generator-archive": "^2.0.0",
        "hexo-generator-category": "^2.0.0",
        "hexo-generator-tag": "^2.0.0",
      },
    },
    null,
    2,
  ),
);
await fs.mkdir(path.join(target, "source/audio"), { recursive: true });
await fs.copyFile(
  path.join(source, "themes/arknights/source/audio/bgm.mp3"),
  path.join(target, "source/audio/bgm.mp3"),
);
await fs.writeFile(
  path.join(target, "migration-report.json"),
  JSON.stringify(
    { source, backup, posts: report.length, changes: report },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({
    target,
    posts: report.length,
    decrypted: report.filter((x) => x.removedEncryption).length,
  }),
);
