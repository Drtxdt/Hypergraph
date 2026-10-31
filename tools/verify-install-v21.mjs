import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import yaml from "js-yaml";
import crypto from "node:crypto";
import { chromium } from "playwright";
import { serve } from "./verify/fixture.mjs";
const root = path.resolve(".local/install-v21-" + Date.now());
await fs.mkdir(root, { recursive: true });
process.on('uncaughtException', async error => {
  await fs.writeFile('.local/install-v21-report.json', JSON.stringify({passed:false,root,error:error.stack},null,2));
  console.error(error);process.exit(1);
});
const npm =
  process.env.npm_execpath ||
  path.join(path.dirname(process.execPath), "node_modules/npm/bin/npm-cli.js");
const run = (args, cwd = root) =>
  new Promise((resolve, reject) => {
    const c = spawn(process.execPath, args, { cwd, stdio: "inherit" });
    c.on("error", reject);
    c.on("exit", (code) =>
      code === 0 ? resolve() : reject(Error("Exit " + code)),
    );
  });
const install = () =>
  run([
    npm,
    "install",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
    "--cache=" + path.resolve(".local/npm-cache"),
    ...(process.env.HTTPS_PROXY
      ? [
          "--proxy=" + process.env.HTTPS_PROXY,
          "--https-proxy=" + process.env.HTTPS_PROXY,
        ]
      : []),
  ]);
const version = JSON.parse(await fs.readFile("package.json", "utf8")).version;
const [tarball, expectedHash] = process.argv.slice(2);
if (!tarball || !/^[a-f0-9]{64}$/i.test(expectedHash || '')) throw Error('Usage: node tools/verify-install-v21.mjs <tarball> <sha256>');
const pack = path.resolve(tarball);
assert.equal(crypto.createHash('sha256').update(await fs.readFile(pack)).digest('hex'), expectedHash.toLowerCase(), 'package SHA256 must match the supplied artifact');
const pkg = JSON.parse(await fs.readFile("demo/package.json", "utf8"));
pkg.dependencies["hexo-theme-hypergraph"] = "file:" + pack;
await fs.cp("demo/source", path.join(root, "source"), { recursive: true });
await fs.cp("examples/visual/source", path.join(root, "source"), {
  recursive: true,
});
await fs.copyFile("demo/_config.yml", path.join(root, "_config.yml"));
await fs.writeFile(path.join(root, "_config.hypergraph.yml"), "{}\n");
await fs.writeFile(
  path.join(root, "package.json"),
  JSON.stringify(pkg, null, 2),
);
await install();
await run([npm, 'exec', '--no', '--', 'hg-cover-candidates', 'source/_posts']);
const installedPackage=JSON.parse(await fs.readFile(path.join(root,'node_modules/hexo-theme-hypergraph/package.json'),'utf8'));
assert.equal(installedPackage.bin['hg-cover-candidates'],'tools/cover-candidates.mjs');
const build = async () => {
  await run([path.join(root, "node_modules/hexo/bin/hexo"), "clean"]);
  await run([path.join(root, "node_modules/hexo/bin/hexo"), "generate"]);
  assert.ok(
    (await fs.readFile(path.join(root, "public/index.html"), "utf8")).includes(
      "layout-endfield",
    ),
  );
};
await build();
const welcomePost = JSON.parse(await fs.readFile(path.join(root,'db.json'),'utf8')).models.Post.find(post => post.slug === 'welcome');
const welcomeRoute = JSON.parse(await fs.readFile(path.join(root,'public/search.json'),'utf8')).find(post => post.title === welcomePost?.title)?.path;
assert.ok(welcomeRoute, 'installer test uses the actual generated welcome route');
assert.equal(installedPackage.version, version);
for (const route of ['archives','gallery','essay','friends','tools','games','about'])
  await fs.access(path.join(root,'public',route,'index.html'));
const defaultHtml=await fs.readFile(path.join(root,'public/index.html'),'utf8');
assert.equal((defaultHtml.match(/<nav id="site-nav"[\s\S]*?<div class="rail-tools">/)?.[0].match(/<a /g)||[]).length,8);
const extension = path.join(root, "extension");
await fs.cp("examples/extension", extension, { recursive: true });
const config = yaml.load(
  await fs.readFile(path.join(root, "_config.hypergraph.yml"), "utf8"),
);
config.extensions = [
  {
    package: "hypergraph-extension-reading-note",
    enable: true,
    config: { text: "Installed extension" },
  },
];
await fs.writeFile(
  path.join(root, "_config.hypergraph.yml"),
  yaml.dump(config),
);
let browser, server;
const evidence = [];
try {
  browser = await chromium.launch({
    channel: process.platform === "win32" ? "msedge" : undefined,
  });
  for (const version of ["1.0.0", "1.1.0"]) {
    const ep = JSON.parse(
      await fs.readFile(path.join(extension, "package.json"), "utf8"),
    );
    ep.version = version;
    await fs.writeFile(
      path.join(extension, "package.json"),
      JSON.stringify(ep),
    );
    await run(
      [
        npm,
        "pack",
        "--offline",
        "--ignore-scripts",
        "--pack-destination",
        root,
      ],
      extension,
    );
    pkg.dependencies["hypergraph-extension-reading-note"] =
      "file:./hypergraph-extension-reading-note-" + version + ".tgz";
    await fs.writeFile(
      path.join(root, "package.json"),
      JSON.stringify(pkg, null, 2),
    );
    await install();
    await build();
    server = await serve(root);
    const page = await browser.newPage();
    page.setDefaultTimeout(20000);
    await page.goto(server.url + welcomeRoute);
    await page.getByText("Installed extension", { exact: true }).waitFor();
    assert.equal(await page.locator("[data-reading-note]").count(), 1);
    await page.close();
    await server.close();
    server = null;
    evidence.push({ version, installed: true });
  }
  config.extensions[0].enable = false;
  await fs.writeFile(
    path.join(root, "_config.hypergraph.yml"),
    yaml.dump(config),
  );
  await build();
  server = await serve(root);
  const page = await browser.newPage();
  await page.goto(server.url + 'tools/json/');
  await page.locator('#utility-input').fill('{"installed":true}');
  await page.locator('[data-operation="format"]').click();
  await page.waitForFunction(() => document.querySelector('#utility-output').value.includes('installed'));
  const requests = [];
  page.on("request", (r) => requests.push(r.url()));
  await page.goto(server.url + welcomeRoute);
  await page.waitForTimeout(300);
  assert.equal(await page.locator("[data-reading-note]").count(), 0);
  assert.ok(!requests.some((x) => x.includes("/extensions/reading-note.js")));
  await fs.writeFile(
    ".local/install-v21-report.json",
    JSON.stringify(
      {
        passed: true,
        root,
        version,
        freshNodeModules: true,
        extension: evidence,
        disabledNoRequest: true,
        packageHash: crypto
          .createHash("sha256")
          .update(await fs.readFile(pack))
          .digest("hex"),
      },
      null,
      2,
    ),
  );
} finally {
  await browser?.close();
  await server?.close();
}
