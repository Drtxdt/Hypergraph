import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { serve, files } from "./verify/fixture.mjs";
const base = path.resolve(".local/private-v21");
const source = path.resolve(process.argv[2] || "D:/hexo/blog");
const crypto = await import("node:crypto");
const hash = async (file) =>
  crypto
    .createHash("sha256")
    .update(await fs.readFile(file))
    .digest("hex");
async function snapshot(root) {
  const entries = await files(path.join(root, "source"));
  const result = {};
  for (const file of entries)
    result[path.relative(root, file)] = await hash(file);
  return result;
}
const before = await snapshot(source);
const oldDatabase = JSON.parse(
  await fs.readFile(path.join(source, "db.json"), "utf8"),
);
const identity = (db) =>
  db.models.Post.map((p) => ({
    source: p.source,
    slug: p.slug,
    date: p.date,
  })).sort((a, b) => a.source.localeCompare(b.source));
assert.equal(identity(oldDatabase).length, 43);
await fs.mkdir(base, { recursive: true });
for (const name of [
  "source",
  "_config.yml",
  "_config.hypergraph.yml",
  "db.json",
])
  await fs.cp(path.join(source, name), path.join(base, name), {
    recursive: true,
    preserveTimestamps: true,
  });
await fs.writeFile(
  path.join(base, "package.json"),
  JSON.stringify({
    name: "hypergraph-private-v21",
    private: true,
    hexo: { version: "7.3.0" },
    dependencies: Object.fromEntries(
      ["index", "archive", "category", "tag"].map((n) => [
        "hexo-generator-" + n,
        "*",
      ]),
    ),
  }),
);
for (const name of [
  "layout",
  "scripts",
  "lib",
  "source",
  "config.schema.json",
  "_config.yml",
])
  await fs.cp(name, path.join(base, "themes/hypergraph", name), {
    recursive: true,
  });
const { default: Hexo } = await import("hexo");
const hexo = new Hexo(base, { silent: true });
try {
  await hexo.init();
  await hexo.call("generate", { concurrency: 1 });
} finally {
  await hexo.exit();
}
assert.deepEqual(
  await snapshot(base),
  before,
  "Validation copy must preserve source bytes",
);
assert.deepEqual(
  await snapshot(source),
  before,
  "Original source must remain untouched",
);
assert.deepEqual(
  identity(JSON.parse(await fs.readFile(path.join(base, "db.json"), "utf8"))),
  identity(oldDatabase),
  "Dates and slugs must be retained",
);
console.log(
  "Private 43-post copy generated; original and preview content hashes match",
);
const server = await serve(base);
let browser;
try {
  const posts = JSON.parse(
    await fs.readFile(path.join(base, "db.json"), "utf8"),
  ).models.Post.sort((a, b) => b.raw.length - a.raw.length);
  const longest = posts[0];
  assert.ok(longest.raw.length > 116000);
  const html = await files(path.join(base, "public"));
  const file = html.find((f) =>
    f.replaceAll("\\", "/").endsWith("/" + longest.slug + "/index.html"),
  );
  assert.ok(file);
  const route = path
    .relative(path.join(base, "public"), file)
    .replaceAll("\\", "/")
    .replace(/index.html$/, "");
  browser = await chromium.launch({ channel: "msedge" });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const checks = [];
  for (const width of [360, 390, 768, 1440])
    for (const mode of ["light", "dark"])
      for (const view of ["", route]) {
        await page.setViewportSize({
          width,
          height: width === 1440 ? 1000 : 844,
        });
        await page.goto(server.url + view);
        await page.evaluate(
          (mode) => (document.documentElement.dataset.mode = mode),
          mode,
        );
        await page.waitForFunction(
          () => !document.documentElement.classList.contains("intro-active"),
        );
        await page.waitForTimeout(400);
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        if (view)
          assert.ok(
            (await page.locator(".prose").textContent()).length > 100000,
          );
        checks.push({
          width,
          mode,
          view: view ? "long" : "home",
          passed: true,
        });
      }
  await page.goto(server.url);
  await page.waitForFunction(() => window.__hypergraph?.swup);
  await page.evaluate(() => {
    window.audio = document.querySelector(".player audio");
    return window.audio.play();
  });
  await page.evaluate(
    (url) => window.__hypergraph.swup.navigate(url),
    server.url + route,
  );
  await page.locator(".prose").waitFor();
  assert.ok(
    await page.evaluate(
      () =>
        window.audio === document.querySelector(".player audio") &&
        !window.audio.paused,
    ),
  );
  assert.deepEqual(errors, []);
  await fs.writeFile(
    ".local/private-v21-report.json",
    JSON.stringify(
      {
        passed: true,
        date: new Date().toISOString(),
        source,
        preview: base,
        posts: 43,
        sourceHashes: before,
        originalUnchanged: true,
        datesAndSlugsUnchanged: true,
        checks,
        rawCharacters: longest.raw.length,
        realAudioNavigation: true,
        unhandledErrors: errors,
      },
      null,
      2,
    ),
  );
} finally {
  await browser?.close();
  await server.close();
}
