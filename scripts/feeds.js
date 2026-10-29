"use strict";
const { escape, plain } = require("../lib/utils.cjs");
hexo.extend.generator.register("hypergraph-feeds", (locals) => {
  const cfg = hexo.theme.config.feeds;
  if (!cfg) return [];
  const base = hexo.config.url.replace(/\/$/, "") + "/";
  const posts = locals.posts.sort("-date").toArray();
  const output = [];
  if (cfg.rss)
    output.push({
      path: "atom.xml",
      data: `<?xml version="1.0" encoding="utf-8"?><feed xmlns="http://www.w3.org/2005/Atom"><title>${escape(hexo.config.title)}</title><id>${escape(base)}</id><link href="${escape(base)}"/><updated>${new Date().toISOString()}</updated>${posts
        .filter((p) => !p.password && !p.hg_encrypted)
        .slice(0, 20)
        .map(
          (p) =>
            `<entry><title>${escape(p.title)}</title><id>${escape(new URL(p.path, base).href)}</id><link href="${escape(new URL(p.path, base).href)}"/><updated>${new Date(p.updated || p.date).toISOString()}</updated><summary>${escape(plain(p.excerpt || p.content).slice(0, 300))}</summary></entry>`,
        )
        .join("")}</feed>`,
    });
  if (cfg.sitemap)
    output.push({
      path: "sitemap.xml",
      data: `<?xml version="1.0" encoding="utf-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${posts.map((p) => `<url><loc>${escape(new URL(p.path, base).href)}</loc></url>`).join("")}</urlset>`,
    });
  return output;
});
