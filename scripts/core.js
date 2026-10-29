"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { resolveConfig, merge } = require("../lib/config.cjs");
const { plain, json, escape } = require("../lib/utils.cjs");
hexo.extend.filter.register(
  "before_generate",
  () => {
    const yaml = require("js-yaml");
    const defaults = yaml.load(
      fs.readFileSync(path.join(__dirname, "../_config.yml"), "utf8"),
    );
    const overridePath = path.join(hexo.base_dir, "_config.hypergraph.yml");
    const overrides = fs.existsSync(overridePath)
      ? yaml.load(fs.readFileSync(overridePath, "utf8")) || {}
      : {};
    const user = merge(overrides, hexo.config.theme_config || {});
    const first = resolveConfig(merge(defaults, user));
    const preset = require("../lib/presets.cjs").getPreset(
      first.preset,
      first.extensions,
      hexo.base_dir,
    );
    hexo.theme.config = resolveConfig(
      merge(merge(defaults, preset.config || {}), user),
    );
    hexo.hypergraphPreset = preset;
    for (const [name, source] of Object.entries(preset.templates || {})) {
      if (!/^[a-z_-]+\.njk$/.test(name))
        throw Error(`Invalid preset template ${name}`);
      hexo.theme.setView(name, source);
    }
  },
  1,
);
hexo.extend.helper.register("hg", () => hexo.theme.config);
hexo.extend.helper.register(
  "hg_t",
  (key) =>
    (require("../lib/i18n.cjs")[hexo.config.language] ||
      require("../lib/i18n.cjs").en)[key] || key,
);
hexo.extend.helper.register("hg_runtime", () =>
  json({
    root: hexo.config.root,
    messages: Object.fromEntries(Object.entries(require("../lib/client-i18n.cjs")).map(([key,value])=>[key, value[String(hexo.config.language).startsWith("zh")?"zh":"en"]])),
    navigation: hexo.theme.config.navigation,
    navigation_exclude: hexo.theme.config.navigation_exclude,
    search: hexo.theme.config.search,
    external_search: hexo.theme.config.external_search,
    lightbox: hexo.theme.config.lightbox,
    code: hexo.theme.config.code,
    tools: hexo.theme.config.tools,
    analytics: hexo.theme.config.analytics,
    chat: hexo.theme.config.chat,
    effects: hexo.theme.config.effects,
    appearance: hexo.theme.config.appearance,
    interaction: hexo.theme.config.interaction,
    music: hexo.theme.config.music,
    adsense: hexo.theme.config.adsense,
    counters: hexo.theme.config.counters,
    pwa: hexo.theme.config.pwa.enable,
    extensions: (hexo.hypergraph?.extensions || [])
      .filter((e) => e.runtime)
      .map(({ id, scope, config }) => ({ id, scope, config })),
  }),
);
hexo.extend.helper.register("hg_json", json);
hexo.extend.helper.register("hg_excerpt", (post) =>
  plain(
    post.abstract || post.description || post.excerpt || post.content,
  ).slice(0, 160),
);
hexo.extend.helper.register("hg_home_excerpt", (post) => {
  const cfg = hexo.theme.config.home;
  if (cfg.excerpt === "off") return "";
  const value =
    cfg.excerpt === "description"
      ? post.abstract || post.description || ""
      : post.abstract || post.description || post.excerpt || post.content;
  return plain(value).slice(0, cfg.excerpt_length);
});
hexo.extend.helper.register("hg_reading", (post) =>
  post.password || post.hg_encrypted
    ? "—"
    : Math.max(1, Math.ceil(plain(post.content).length / 450)),
);
hexo.extend.helper.register("hg_featured", () =>
  hexo.locals
    .get("posts")
    .toArray()
    .sort(
      (a, b) =>
        (Number(b.sticky) || 0) - (Number(a.sticky) || 0) ||
        new Date(b.date) - new Date(a.date),
    )
    .slice(0, 3),
);
hexo.extend.helper.register("hg_related", (post) =>
  hexo.theme.config.post.related_limit
    ? hexo.locals
        .get("posts")
        .filter(
          (p) =>
            p.path !== post.path &&
            p.tags
              .toArray()
              .some((t) => post.tags.toArray().some((s) => s.name === t.name)),
        )
        .limit(hexo.theme.config.post.related_limit)
        .toArray()
    : [],
);
hexo.extend.helper.register(
  "hg_canonical",
  (p) =>
    new URL(
      (p.path || "").replace(/index\.html$/, ""),
      hexo.config.url.replace(/\/$/, "") + "/",
    ).href,
);
hexo.extend.helper.register("hg_assets", function (page) {
  return /class="katex|data-math="katex"/.test(page.content || "")
    ? `<link rel="stylesheet" href="${escape(this.url_for("/assets/katex/katex.min.css"))}" data-page-style>`
    : "";
});
hexo.extend.generator.register("hypergraph-search", (locals) => {
  if (!hexo.theme.config.search) return [];
  return {
    path: "search.json",
    data: json(
      locals.posts
        .sort("-date")
        .toArray()
        .filter((p) => !p.password && !p.hg_encrypted)
        .map((p) => ({
          title: p.title,
          path: p.path,
          text: plain(p.content),
          tags: p.tags.map((t) => t.name),
        })),
    ),
  };
});
hexo.extend.filter.register("markdown-it:renderer", (md) => {
  if (md.__hypergraphMath) return;
  md.use(require("@renbaoshuo/markdown-it-katex"), {
    throwOnError: false,
    strict: "ignore",
    trust: false,
    skipDelimitersCheck: true,
  });
  const { engineFor, renderMath } = require("../lib/math.cjs");
  md.renderer.rules.math_inline = (tokens, index, options, env) =>
    renderMath(
      tokens[index].content,
      false,
      engineFor(env.postPath, hexo.theme.config.math || "katex"),
    );
  md.renderer.rules.math_block = (tokens, index, options, env) =>
    '<div class="math-block">' +
    renderMath(
      tokens[index].content,
      true,
      engineFor(env.postPath, hexo.theme.config.math || "katex"),
    ) +
    "</div>";
  md.__hypergraphMath = true;
});
