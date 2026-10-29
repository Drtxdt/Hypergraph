import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import yaml from "js-yaml";
import { files } from "./verify/fixture.mjs";
const workspace = process.cwd(),
  source = path.resolve(
    process.argv.find((x) => x.startsWith("--source="))?.slice(9) ||
      "D:/hexo/blog",
  );
const out = path.resolve(".local/v2-migration"),
  preview = path.join(out, "preview");
await fs.mkdir(out, { recursive: true });
const hash = async (file) =>
  crypto
    .createHash("sha256")
    .update(await fs.readFile(file))
    .digest("hex");
async function snapshot(root) {
  const result = {};
  for (const file of await files(path.join(root, "source")))
    result[path.relative(root, file)] = await hash(file);
  return result;
}
const run = (args, cwd) =>
  new Promise((resolve, reject) => {
    const c = spawn(process.execPath, args, { cwd, stdio: "inherit" });
    c.on("error", reject);
    c.on("exit", (code) =>
      code === 0 ? resolve() : reject(Error("Command exited " + code)),
    );
  });
const npm =
  process.env.npm_execpath ||
  path.join(path.dirname(process.execPath), "node_modules/npm/bin/npm-cli.js");
async function install(root) {
  await run(
    [
      npm,
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--cache=" + path.join(workspace, ".local/npm-cache"),
      ...(process.env.HTTPS_PROXY
        ? [
            "--proxy=" + process.env.HTTPS_PROXY,
            "--https-proxy=" + process.env.HTTPS_PROXY,
          ]
        : []),
    ],
    root,
  );
}
async function build(root) {
  await run([path.join(root, "node_modules/hexo/bin/hexo"), "clean"], root);
  await run([path.join(root, "node_modules/hexo/bin/hexo"), "generate"], root);
  const html = await fs.readFile(path.join(root, "public/index.html"), "utf8");
  assert.ok(html.includes("layout-endfield"));
  assert.ok(!html.includes("{%"));
}
async function paths(root) {
  const db = JSON.parse(await fs.readFile(path.join(root, "db.json"), "utf8"));
  return db.models.Post.map((p) => ({
    source: p.source,
    slug: p.slug,
    date: p.date,
    title: p.title,
  })).sort((a, b) => a.source.localeCompare(b.source));
}
async function links(root) {
  const broken = [];
  for (const file of await files(path.join(root, "public"))) {
    if (!file.endsWith(".html")) continue;
    const html = await fs.readFile(file, "utf8");
    for (const match of html.matchAll(
      /(?:href|src)="(\/(?!\/)[^"?#]*)(?:[?#][^"]*)?"/g,
    )) {
      let target;
      try {
        target = decodeURIComponent(match[1]);
      } catch {
        continue;
      }
      if (target.endsWith("/")) target += "index.html";
      try {
        await fs.access(path.join(root, "public", target));
      } catch {
        broken.push({ page: path.relative(root, file), target });
      }
    }
  }
  return broken;
}
if (!process.argv.includes("--apply")) {
  await fs.mkdir(preview, { recursive: true });
  for (const name of [
    "source",
    "scaffolds",
    "_config.yml",
    "_config.hypergraph.yml",
    "package.json",
    "package-lock.json",
    "db.json",
  ])
    await fs.cp(path.join(source, name), path.join(preview, name), {
      recursive: true,
    });
  const outputPaths = (await files(path.join(source, "public")))
    .filter((f) => f.endsWith(".html"))
    .map((f) => path.relative(path.join(source, "public"), f));
  const before = await snapshot(source),
    beforePaths = await paths(source);
  assert.equal(beforePaths.length, 43);
  const config = yaml.load(
    await fs.readFile(path.join(preview, "_config.hypergraph.yml"), "utf8"),
  );
  config.preset = "endfield";
  delete config.layout;
  config.menu = Array.isArray(config.menu)
    ? config.menu
    : Object.entries(config.menu).map(([label, url]) => ({
        label,
        url,
        icon:
          {
            home: "home",
            archives: "archive",
            about: "user",
            friends: "users",
            music: "music",
          }[label] || "link",
      }));
  config.appearance = { ...config.appearance, motion: "cinematic" };
  delete config.appearance.entrance;
  await fs.writeFile(
    path.join(preview, "_config.hypergraph.yml"),
    yaml.dump(config),
  );
  await fs.mkdir(path.join(preview, "vendor"), { recursive: true });
  await fs.copyFile(
    "dist/hexo-theme-hypergraph-2.0.0.tgz",
    path.join(preview, "vendor/hexo-theme-hypergraph-2.0.0.tgz"),
  );
  const pkg = JSON.parse(
    await fs.readFile(path.join(preview, "package.json"), "utf8"),
  );
  pkg.dependencies["hexo-theme-hypergraph"] =
    "file:vendor/hexo-theme-hypergraph-2.0.0.tgz";
  await fs.writeFile(
    path.join(preview, "package.json"),
    JSON.stringify(pkg, null, 2),
  );
  await install(preview);
  await build(preview);
  assert.deepEqual(await snapshot(preview), before);
  assert.deepEqual(await paths(preview), beforePaths);
  for (const p of outputPaths) await fs.access(path.join(preview, "public", p));
  const broken = await links(preview);
  assert.deepEqual(broken, []);
  await fs.writeFile(
    path.join(out, "preview-report.json"),
    JSON.stringify(
      {
        passed: true,
        source,
        preview,
        before,
        beforePaths,
        outputPaths,
        broken,
        packageHash: await hash("dist/hexo-theme-hypergraph-2.0.0.tgz"),
      },
      null,
      2,
    ),
  );
  console.log("Migration preview passed");
} else {
  const evidence = JSON.parse(
    await fs.readFile(path.join(out, "preview-report.json"), "utf8"),
  );
  const verification = JSON.parse(
    await fs.readFile(".local/verification/report.json", "utf8"),
  );
  assert.ok(evidence.passed && verification.passed);
  assert.equal(
    await hash("dist/hexo-theme-hypergraph-2.0.0.tgz"),
    evidence.packageHash,
  );
  assert.deepEqual(await snapshot(source), evidence.before);
  const backup = path.resolve(
    ".local/backups/before-v2-" +
      new Date().toISOString().replace(/[:.]/g, "-"),
  );
  await fs.mkdir(backup, { recursive: true });
  for (const name of [
    "source",
    "themes",
    "scaffolds",
    "vendor",
    "_config.yml",
    "_config.hypergraph.yml",
    "package.json",
    "package-lock.json",
    "db.json",
  ])
    await fs.cp(path.join(source, name), path.join(backup, name), {
      recursive: true,
    });
  for (const name of [
    "_config.hypergraph.yml",
    "package.json",
    "package-lock.json",
    "vendor/hexo-theme-hypergraph-2.0.0.tgz",
  ])
    await fs.copyFile(path.join(preview, name), path.join(source, name));
  await install(source);
  await build(source);
  assert.deepEqual(await snapshot(source), evidence.before);
  assert.deepEqual(await paths(source), evidence.beforePaths);
  for (const p of evidence.outputPaths)
    await fs.access(path.join(source, "public", p));
  const broken = await links(source);
  assert.deepEqual(broken, []);
  await fs.writeFile(
    path.join(out, "application-report.json"),
    JSON.stringify(
      {
        passed: true,
        date: new Date().toISOString(),
        source,
        backup,
        posts: 43,
        sourceUnchanged: true,
        datesAndUrlsUnchanged: true,
        broken,
        packageHash: evidence.packageHash,
      },
      null,
      2,
    ),
  );
  console.log("Local blog upgraded, source unchanged. Backup: " + backup);
}
