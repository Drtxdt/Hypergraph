"use strict";
const { escape, json, plain } = require("../lib/utils.cjs");
hexo.extend.helper.register("hg_seo", function (page) {
  const url = this.hg_canonical(page),
    description = this.hg_excerpt(page) || hexo.config.description || "";
  const data = {
    "@context": "https://schema.org",
    "@type": this.is_post() ? "BlogPosting" : "WebSite",
    name: page.title || hexo.config.title,
    url,
    description,
  };
  if (this.is_post()) {
    data.headline = page.title;
    data.datePublished = new Date(page.date).toISOString();
    data.dateModified = new Date(page.updated || page.date).toISOString();
    data.author = { "@type": "Person", name: hexo.config.author };
  }
  const cfg = hexo.theme.config.seo;
  let output = "";
  if (cfg.open_graph) {
    output += `<meta property="og:title" content="${escape(page.title || hexo.config.title)}"><meta property="og:type" content="${this.is_post() ? "article" : "website"}"><meta property="og:url" content="${escape(url)}"><meta property="og:description" content="${escape(description)}"><meta property="og:site_name" content="${escape(hexo.config.title)}"><meta name="twitter:card" content="summary">`;
    if (cfg.twitter)
      output += `<meta name="twitter:site" content="${escape(cfg.twitter)}">`;
    if (page.cover)
      output += `<meta property="og:image" content="${escape(new URL(page.cover, hexo.config.url).href)}">`;
  }
  if (cfg.structured_data)
    output += `<script type="application/ld+json">${json(data)}</script>`;
  for (const item of hexo.theme.config.verification || [])
    output += `<meta name="${escape(item.name)}" content="${escape(item.content)}">`;
  return output;
});
hexo.extend.generator.register("hypergraph-index-pages", () => [
  {
    path: "categories/index.html",
    layout: "taxonomy",
    data: {
      title: hexo.config.language === "zh-CN" ? "分类" : "Categories",
      taxonomy: "categories",
    },
  },
  {
    path: "tags/index.html",
    layout: "taxonomy",
    data: {
      title: hexo.config.language === "zh-CN" ? "标签" : "Tags",
      taxonomy: "tags",
    },
  },
  { path: "404.html", layout: "404", data: { title: "404" } },
]);
