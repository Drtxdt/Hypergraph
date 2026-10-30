"use strict";
const { pagePath } = require("../lib/page-path.cjs");
const { types, normalize } = require("../lib/collections.cjs");
hexo.extend.helper.register("hg_page_path", (type) =>
  pagePath(type, hexo.theme.config.pages?.[type]),
);
hexo.extend.helper.register("hg_link", function (url) {
  const value = String(url || "");
  try {
    if (
      !["http:", "https:", "mailto:"].includes(
        new URL(value, "https://example.com").protocol,
      )
    )
      return "#";
  } catch {
    return "#";
  }
  return this.url_for(value);
});
hexo.extend.generator.register("hypergraph-collections", (locals) => {
  const cfg = hexo.theme.config.pages,
    output = [];
  const manual = new Set(locals.pages.toArray().map((p) => p.path));
  const language = String(hexo.config.language).startsWith("zh")
    ? "zh-CN"
    : "en";
  const words = require("../lib/i18n.cjs")[language];
  const generated = new Set();
  const add = (path, layout, data) => {
    if (manual.has(path)) return;
    if (generated.has(path))
      throw Error(`Hypergraph pages: duplicate generated route ${path}`);
    generated.add(path);
    output.push({ path, layout, data: { ...data, layout } });
  };
  for (const type of types) {
    if (!cfg[type]?.enable) continue;
    const data = normalize(type, locals.data.hypergraph?.[type]);
    const base = pagePath(type, cfg[type]);
    const layout = ["about", "friends", "gallery", "tools", "games"].includes(
      type,
    )
      ? type
      : "collection";
    const common = {
      title: cfg[type].title || words[type] || type,
      type,
      description: cfg[type].description || "",
      remote: cfg[type].endpoint || "",
      ...data,
    };
    if (type === "about")
      common.linkedPosts = (data.posts || [])
        .map((ref) =>
          locals.posts.toArray().find((p) => p.path === ref || p.slug === ref),
        )
        .filter((p) => p && !p.password && !p.hg_encrypted);
    common.builtins = (cfg[type].builtins || []).map((id) => ({
      id,
      title: words[id] || id,
      path: base + id + "/",
    }));
    add(base + "index.html", layout, common);
    for (const app of common.builtins)
      add(app.path + "index.html", "utility", {
        ...common,
        title: app.title,
        app: app.id,
        parent: base,
      });
    for (const album of data.albums)
      add(base + album.slug + "/index.html", "album", {
        ...common,
        ...album,
        parent: base,
      });
  }
  return output;
});
