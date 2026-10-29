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
const pack = path.resolve("dist/hexo-theme-hypergraph-2.1.0-beta.1.tgz");
const pkg = JSON.parse(await fs.readFile("demo/package.json", "utf8"));
pkg.dependencies["hexo-theme-hypergraph"] = "file:" + pack;
await fs.cp("demo/source", path.join(root, "source"), { recursive: true });
await fs.cp("examples/visual/source", path.join(root, "source"), {
  recursive: true,
});
await fs.copyFile("demo/_config.yml", path.join(root, "_config.yml"));
await fs.copyFile(
  "demo/_config.hypergraph.yml",
  path.join(root, "_config.hypergraph.yml"),
);
await fs.writeFile(
  path.join(root, "package.json"),
  JSON.stringify(pkg, null, 2),
);
await install();
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
    await page.goto(server.url + "2026/10/28/welcome/");
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
  const requests = [];
  page.on("request", (r) => requests.push(r.url()));
  await page.goto(server.url + "2026/10/28/welcome/");
  await page.waitForTimeout(300);
  assert.equal(await page.locator("[data-reading-note]").count(), 0);
  assert.ok(!requests.some((x) => x.includes("/extensions/reading-note.js")));
  await fs.writeFile(
    ".local/install-v21-report.json",
    JSON.stringify(
      {
        passed: true,
        root,
        version: "2.1.0-beta.1",
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
