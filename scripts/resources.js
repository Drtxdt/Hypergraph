"use strict";
const { escape } = require("../lib/utils.cjs");
hexo.extend.helper.register("hg_asset", function (file) {
  const base = hexo.theme.config.resources.asset_base;
  return base
    ? base.replace(/\/$/, "") + "/" + file
    : this.url_for("/assets/" + file);
});
hexo.extend.helper.register("hg_module_preloads", function (page) {
  const manifest = JSON.parse(
    require("node:fs").readFileSync(
      require("node:path").join(hexo.theme_dir, "source/assets/manifest.json"),
      "utf8",
    ),
  );
  const seen = new Set();
  const visit = (key) => {
    if (seen.has(key)) return;
    seen.add(key);
    for (const dependency of manifest[key]?.imports || []) visit(dependency);
  };
  visit("src/main.ts");
  let output = [...seen]
    .map(
      (key) =>
        `<link rel="modulepreload" crossorigin href="${escape(this.hg_asset(manifest[key].file))}">`,
    )
    .join("");
  const cfg = hexo.theme.config;
  if (
    this.is_home() &&
    (!page.current || page.current === 1) &&
    cfg.appearance.motion === "cinematic" &&
    cfg.appearance.laser_print &&
    (cfg.home.masthead.artwork.enable ||
      (cfg.appearance.show_cover && cfg.home.masthead.image.src))
  ) {
    const url = JSON.stringify(
      this.hg_asset(manifest["src/modules/laser-print.ts"].file),
    ).replace(/</g, "\\u003c");
    output += `<script>if(!matchMedia('(prefers-reduced-motion:reduce)').matches&&!navigator.connection?.saveData&&!location.hash&&performance.getEntriesByType('navigation')[0]?.type!=='back_forward'){const link=document.createElement('link');link.rel='modulepreload';link.crossOrigin='anonymous';link.href=${url};document.head.append(link)}</script>`;
  }
  return output;
});
hexo.extend.helper.register("hg_footer", function () {
  const cfg = hexo.theme.config.footer;
  let html = "";
  if (cfg.start_date) {
    const days = Math.max(
      0,
      Math.floor((Date.now() - new Date(cfg.start_date).getTime()) / 86400000),
    );
    if (Number.isFinite(days))
      html += `<p data-runtime="${escape(cfg.start_date)}">${days} days</p>`;
  }
  for (const item of cfg.links)
    html += `<a href="${escape(this.url_for(item.url))}" rel="noopener">${item.image ? `<img src="${escape(this.url_for(item.image))}" alt="${escape(item.title)}" loading="lazy">` : escape(item.title)}</a>`;
  return html;
});
hexo.extend.generator.register("hypergraph-random", (locals) =>
  hexo.theme.config.interaction.random_post
    ? {
        path: "random.json",
        data: JSON.stringify(
          locals.posts
            .toArray()
            .filter((p) => !p.password && !p.hg_encrypted)
            .map((p) => p.path),
        ),
      }
    : [],
);
hexo.extend.filter.register("after_render:html", (html) => {
  if (!hexo.theme.config.resources.lazy_images)
    return html.replace(/(<img\b[^>]*?)\sloading=["']lazy["']/gi, "$1");
  return html.replace(/<img\b[^>]*>/gi, (tag) =>
    /\bloading\s*=|\bfetchpriority\s*=/i.test(tag)
      ? tag
      : tag.replace("<img", '<img loading="lazy" decoding="async"'),
  );
});
