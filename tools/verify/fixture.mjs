import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import { createRequire } from "node:module";
import yaml from "js-yaml";
const require = createRequire(import.meta.url);
const { merge } = require("../../lib/config.cjs");
export async function generate(base, options = {}) {
  const root = options.root || "/";
  await fs.mkdir(path.join(base, "source/_posts"), { recursive: true });
  await fs.cp("demo/source", path.join(base, "source"), { recursive: true });
  await fs.cp("examples/visual/source", path.join(base, "source"), {
    recursive: true,
  });
  await fs.mkdir(path.join(base, "source/standalone"), {recursive:true});
  await fs.writeFile(path.join(base, "source/standalone/index.md"), "---\nlayout: page\ntitle: 独立页面阅读指南\n---\n## 从这里开始\n\n这是普通页面的真实正文，用于验证标题、内容与评论的共同阅读轴。\n\n## 保持连续\n\n正文可以选择、复制与打印。\n");
  await fs.mkdir(path.join(base, "source/media-regression"), {recursive:true});
  await fs.writeFile(path.join(base, "source/media-regression/index.md"), '---\nlayout: page\ntitle: Image loading regression\n---\n<img src="/images/record.svg" alt="First image">\n<div style="height:10000px"></div>\n<img src="/images/connect.svg" loading="lazy" alt="Deferred image">\n');
  if (options.content) await fs.cp("examples/content/source", path.join(base, "source"), {recursive:true});
  const postDir = path.join(base, "source/_posts");
  if (options.empty || options.few)
    for (const file of await fs.readdir(postDir))
      if (options.empty || file !== "field-study.md")
        await fs.unlink(path.join(postDir, file));
  if (!options.empty && !options.few) {
    const long = [
      "---",
      "title: 长文阅读与深层锚点验证",
      "date: '2026-10-20 10:00:00'",
      "categories: [验证]",
      "---",
    ];
    for (let i = 0; i < 160; i++)
      long.push(
        `## Section ${i}\n\n` +
          "完整正文可搜索、选择和打印。Hypergraph field journal. ".repeat(20) +
          `\n\n\x60\x60\x60js\nconst section${i} = 'deep-code-${i}';\n\x60\x60\x60\n`,
      );
    await fs.writeFile(path.join(postDir, "long.md"), long.join("\n"));
    for (const type of ["plain", "code", "math"])
      await fs.writeFile(
        path.join(postDir, "private-" + type + ".md"),
        `---\ntitle: Private ${type}\ndate: '2026-10-19 10:00:00'\npassword: fixture-password-7329\nabstract: Public summary ${type}\n---\n## Private heading\nPRIVATE_CANARY_${type}_7329\n\n` +
          (type === "code"
            ? "```js\nconst privateValue = 'SECRET_CODE_7329';\n```"
            : type === "math"
              ? "$$x^2+y^2=z^2$$"
              : ""),
      );
  }
  if (options.noCover) {
    const file = path.join(postDir, "field-study.md");
    await fs.writeFile(
      file,
      (await fs.readFile(file, "utf8"))
        .replace(/^cover:.*$/m, "")
        .replace(
          /^title:.*/m,
          "title: 在复杂而不断变化的世界里，我们如何为长期写作建立一个清晰、安静并且可以持续生长的数字空间",
        ),
    );
  }
  const config = yaml.load(await fs.readFile("demo/_config.yml", "utf8"));
  config.timezone = "UTC";
  config.root = root;
  config.url =
    "https://example.com" + (root === "/" ? "" : root.replace(/\/$/, ""));
  config.language = options.language || "zh-CN";
  config.index_generator.per_page = options.perPage ?? 30;
  await fs.writeFile(path.join(base, "_config.yml"), yaml.dump(config));
  const theme = merge(
    {
      preset: "endfield",
      menu: [
        { label: "home", url: "/", icon: "home" },
        { label: "archives", url: "/archives/", icon: "archive" },
        { label: "about", url: "/about/", icon: "about" },
      ],
      sidebar: { enable: false },
      music: { enable: true, src: "/audio/sample.wav", title: "Sample" },
      pages: Object.fromEntries(
        [
          "about",
          "friends",
          "gallery",
          "essay",
          "equipment",
          "music",
          "room",
          "fcircle",
        ].map((type) => [type, { enable: true }]),
      ),
    },
    options.theme || {},
  );
  await fs.writeFile(
    path.join(base, "_config.hypergraph.yml"),
    yaml.dump(theme),
  );
  await fs.writeFile(
    path.join(base, "package.json"),
    JSON.stringify({
      name: "hypergraph-verification",
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
  const Hexo = require(options.hexo || "hexo");
  const hexo = new Hexo(base, { silent: true });
  const errors = [];
  const original = hexo.log.error.bind(hexo.log);
  hexo.log.error = (...args) => {
    errors.push(args.map(String).join(" "));
    original(...args);
  };
  await hexo.init();
  await hexo.call("generate", { concurrency: 1 });
  await fs.writeFile(path.join(base, "routes.json"), JSON.stringify(Object.fromEntries(hexo.locals.get("posts").toArray().map(post => [post.slug, post.path])), null, 2));
  await hexo.exit();
  if (errors.length) throw Error(errors.join("\n"));
  const html = await fs.readFile(path.join(base, "public/index.html"), "utf8");
  if (!html.includes('id="content"') || html.includes("{%"))
    throw Error("Invalid generated HTML");
  return base;
}
export async function serve(base, mount = "/") {
  const root = path.resolve(base, "public");
  const types = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
    ".wav": "audio/wav",
  };
  const server = http.createServer(async (req, res) => {
    try {
      let name = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      if (!name.startsWith(mount)) throw Error();
      name = name.slice(mount.length);
      if (!name || name.endsWith("/")) name += "index.html";
      const file = path.resolve(root, name);
      if (!file.startsWith(root + path.sep)) throw Error();
      const data = await fs.readFile(file);
      const headers = { "Content-Type": types[path.extname(file)] || "application/octet-stream", "Accept-Ranges": "bytes" };
      const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || "");
      if (range) {
        const start = Number(range[1]), end = Math.min(data.length - 1, range[2] ? Number(range[2]) : data.length - 1);
        if (start > end || start >= data.length) { res.writeHead(416, { "Content-Range": `bytes */${data.length}` }); res.end(); return; }
        res.writeHead(206, { ...headers, "Content-Range": `bytes ${start}-${end}/${data.length}`, "Content-Length": end - start + 1 });
        res.end(data.subarray(start, end + 1));
      } else {
        // Negotiate only shipped sidecars, as nginx gzip_static does. Never
        // synthesize smaller responses just for the performance fixture.
        const acceptsGzip = (req.headers["accept-encoding"] || "").split(",").some(value => /^gzip(?:\s*;|$)/.test(value.trim()) && !/;\s*q=0(?:\.0*)?$/.test(value.trim()));
        const compressed = acceptsGzip ? await fs.readFile(file + ".gz").catch(() => null) : null;
        const body = compressed || data;
        res.writeHead(200, { ...headers, "Vary": "Accept-Encoding", ...(compressed ? { "Content-Encoding": "gzip" } : {}), "Content-Length": body.length });
        res.end(body);
      }
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    routes: JSON.parse(await fs.readFile(path.join(base, "routes.json"), "utf8").catch(()=>"{}")),
    url: "http://127.0.0.1:" + server.address().port + mount,
    close: () =>
      new Promise((resolve) => {
        server.closeAllConnections();
        server.close(resolve);
      }),
  };
}
export async function files(root) {
  let out = [];
  for (const item of await fs.readdir(root, { withFileTypes: true })) {
    const file = path.join(root, item.name);
    out.push(...(item.isDirectory() ? await files(file) : [file]));
  }
  return out;
}

export function route(site, slug) { const value=site.routes?.[slug]; if (!value) throw Error("Missing generated route: "+slug); return value; }
