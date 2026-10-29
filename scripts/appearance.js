"use strict";
const { escape, plain } = require("../lib/utils.cjs");
hexo.extend.helper.register("hg_image", function (src) {
  return this.url_for(src) + (hexo.theme.config.appearance.image_suffix || "");
});
hexo.extend.helper.register("hg_hero", function (page) {
  const cfg = hexo.theme.config.appearance;
  let type = this.is_home()
    ? "home"
    : this.is_archive()
      ? "archive"
      : this.is_category()
        ? "category"
        : this.is_tag()
          ? "tag"
          : "page";
  const src =
    page.banner ||
    cfg.taxonomy_banners[type + ":" + (page.category || page.tag || "")] ||
    cfg.hero[type];
  if (!src) return "";
  return `<div class="page-banner" style="--banner-height:${cfg.hero.height}px"><img src="${escape(this.url_for(src))}" alt="" width="1200" height="${cfg.hero.height}" decoding="async" fetchpriority="high"></div>`;
});
hexo.extend.helper.register("hg_post_meta", function (post) {
  const labels = [];
  for (const field of hexo.theme.config.post.meta) {
    if (field === "date") labels.push(this.date(post.date, "YYYY.MM.DD"));
    if (field === "updated")
      labels.push(this.date(post.updated || post.date, "YYYY.MM.DD"));
    if (field === "reading")
      labels.push(this.hg_reading(post) + " " + this.hg_t("min_read"));
    if (field === "words" && !post.password && !post.hg_encrypted)
      labels.push(plain(post.content).length + " " + this.hg_t("characters"));
  }
  return labels.map(escape).join(" / ");
});
