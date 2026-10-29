"use strict";
const { escape } = require("../lib/utils.cjs");
hexo.extend.helper.register("hg_asset", function (file) {
  const base = hexo.theme.config.resources.asset_base;
  return base
    ? base.replace(/\/$/, "") + "/" + file
    : this.url_for("/assets/" + file);
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
  if (!hexo.theme.config.resources.lazy_images) return html.replace(/(<img\b[^>]*?)\sloading=["']lazy["']/gi, "$1");
  return html.replace(/<img\b[^>]*>/gi, (tag) =>
    /\bloading\s*=|\bfetchpriority\s*=/i.test(tag)
      ? tag
      : tag.replace("<img", '<img loading="lazy" decoding="async"'),
  );
});
