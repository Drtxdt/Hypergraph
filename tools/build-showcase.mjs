import fs from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import Hexo from "hexo";
import yaml from "js-yaml";
import { fileURLToPath } from "node:url";
process.chdir(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
// Hexo's theme asset processor caches state per process; isolate each variant.
if (process.argv[2] === "--generate") {
  const hexo = new Hexo(path.resolve(process.argv[3]), { silent: true });
  try {
    await hexo.init();
    await hexo.call("generate", { concurrency: 1 });
  } finally {
    await hexo.exit();
  }
  process.exit(0);
}
const { files } = await import("./verify/fixture.mjs");
const version = JSON.parse(await fs.readFile("package.json", "utf8")).version;
const tarball = path.resolve(
  process.argv[2] || `dist/hexo-theme-hypergraph-${version}.tgz`,
);
const baseUrl = new URL(
  (process.argv[3] || "https://drtxdt.github.io/Hypergraph/").replace(
    /\/?$/,
    "/",
  ),
);
const workspace = path.resolve(".local/showcase");
if (!workspace.startsWith(path.resolve(".local") + path.sep))
  throw Error("Unsafe output");
await fs.rm(workspace, { recursive: true, force: true });
await fs.mkdir(workspace, { recursive: true });
execFileSync("tar", ["-xzf", tarball, "-C", workspace]);
const theme = path.join(workspace, "package");
if (
  JSON.parse(await fs.readFile(path.join(theme, "package.json"), "utf8"))
    .version !== version
)
  throw Error("Package version differs");
const variants = [
  ["", {}],
  [
    "examples/photography/",
    yaml.load(await fs.readFile("examples/recipes/photography.yml", "utf8")),
  ],
  [
    "examples/mark/",
    {
      home: {
        masthead: {
          artwork: {
            image: {
              src: "/images/print-mark.svg",
              mobile: "/images/print-mark.png",
              position: "0% 0%",
              mobile_position: "100% 50%",
            },
          },
        },
      },
    },
  ],
];
for (const [suffix, override] of variants) {
  const base = path.join(workspace, "sites", suffix || "default");
  await fs.mkdir(base, { recursive: true });
  await fs.cp("demo/source", path.join(base, "source"), { recursive: true });
  await fs.cp("examples/content/source", path.join(base, "source"), {
    recursive: true,
  });
  await fs.cp(
    "examples/visual/source/images",
    path.join(base, "source/images"),
    { recursive: true },
  );
  await fs.mkdir(path.join(base, "themes"), { recursive: true });
  await fs.cp(theme, path.join(base, "themes/hypergraph"), { recursive: true });
  const config = yaml.load(await fs.readFile("demo/_config.yml", "utf8"));
  config.url = new URL(suffix, baseUrl).href.replace(/\/$/, "");
  config.root = new URL(suffix, baseUrl).pathname;
  await fs.writeFile(path.join(base, "_config.yml"), yaml.dump(config));
  const merge = (await import("../lib/config.cjs")).default.merge;
  const themeConfig = merge(
    yaml.load(await fs.readFile("demo/_config.hypergraph.yml", "utf8")),
    override,
  );
  themeConfig.home.title = override.home?.title || "记录与连接";
  themeConfig.menu = [
    { label: "默认字标", url: baseUrl.href, icon: "home" },
    { label: "归档", url: "/archives/", icon: "archive" },
    { label: "影像", url: "/gallery/", icon: "image" },
    {
      label: "摄影示例",
      url: new URL("examples/photography/", baseUrl).href,
      icon: "image",
    },
    {
      label: "自定义标识",
      url: new URL("examples/mark/", baseUrl).href,
      icon: "grid",
    },
    {
      label: "源码",
      url: "https://github.com/Drtxdt/Hypergraph",
      icon: "link",
    },
  ];
  themeConfig.navigation_exclude = ["examples/"];
  themeConfig.comments = { enable: false };
  themeConfig.music = { enable: false };
  await fs.writeFile(
    path.join(base, "_config.hypergraph.yml"),
    yaml.dump(themeConfig),
  );
  await fs.writeFile(
    path.join(base, "package.json"),
    JSON.stringify({
      name: "hypergraph-showcase",
      private: true,
      hexo: { version: "7.3.0" },
      dependencies: Object.fromEntries(
        ["index", "archive", "category", "tag"].map((x) => [
          "hexo-generator-" + x,
          "*",
        ]),
      ),
    }),
  );
  execFileSync(
    process.execPath,
    [fileURLToPath(import.meta.url), "--generate", base],
    { stdio: "inherit" },
  );
  for (const file of await files(path.join(base, "public")))
    if (file.endsWith(".html")) {
      let html = await fs.readFile(file, "utf8");
      for (const link of [
        baseUrl.href,
        new URL("examples/photography/", baseUrl).href,
        new URL("examples/mark/", baseUrl).href,
      ])
        html = html.replaceAll(`href="${link}"`, `data-no-swup href="${link}"`);
      await fs.writeFile(file, html);
      try {
        await fs.access(file + ".gz");
        await fs.writeFile(file + ".gz", gzipSync(html));
      } catch {}
    }
  await fs.cp(
    path.join(base, "public"),
    path.join(workspace, "public", suffix),
    { recursive: true },
  );
}
const metadata = {
  version,
  sha256: createHash("sha256")
    .update(await fs.readFile(tarball))
    .digest("hex"),
  commit: execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim(),
  url: baseUrl.href,
};
await fs.writeFile(
  path.join(workspace, "public/build.json"),
  JSON.stringify(metadata, null, 2),
);
await fs.writeFile(path.join(workspace, "public/.nojekyll"), "");
console.log(JSON.stringify(metadata, null, 2));
