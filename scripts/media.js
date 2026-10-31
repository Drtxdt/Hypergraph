"use strict";
const { escape } = require("../lib/utils.cjs");
hexo.extend.helper.register(
  "hg_picture",
  function (image, className = "", eager = false, environment = false) {
    if (
      !image?.src ||
      (!environment && !hexo.theme.config.appearance.show_cover)
    )
      return "";
    const data = { ...image };
    for (const k of ["src", "mobile", "dark", "mobile_dark", "fallback"])
      if (data[k]) data[k] = this.hg_image(data[k]);
    const attr = escape(JSON.stringify(data));
    const source = (src, media) =>
      src ? `<source media="${media}" srcset="${escape(src)}">` : "";
    const fallback = `<picture>${source(data.mobile_dark || data.mobile || data.dark, "(max-width:1023px) and (prefers-color-scheme:dark)")}${source(data.mobile, "(max-width:1023px)")}${source(data.dark, "(prefers-color-scheme:dark)")}<img src="${escape(data.src)}" alt="${escape(data.alt || "")}" width="1200" height="800" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'}></picture>`;
    return `<figure class="responsive-media ${escape(className)}" data-responsive-image="${attr}" data-fit="${data.fit || "cover"}" data-eager="${eager}" style="--image-position:${escape(data.position || "50% 50%")};--image-mobile-position:${escape(data.mobile_position || data.position || "50% 50%")}"><noscript>${fallback}</noscript>${data.caption ? `<figcaption>${escape(data.caption)}</figcaption>` : ""}</figure>`;
  },
);
hexo.extend.helper.register("hg_page_banner", function (page) {
  const cfg = hexo.theme.config;
  if (
    !cfg.page_banner.enable ||
    this.is_post() ||
    this.is_home() ||
    page.layout === "utility"
  )
    return "";
  const type = page.category
    ? "category"
    : page.tag
      ? "tag"
      : this.is_archive()
        ? "archive"
        : (page.layout === "album" ? "album" : page.type) ||
          page.layout ||
          "page";
  const key = page.category
    ? "category:" + page.category
    : page.tag
      ? "tag:" + page.tag
      : page.path;
  const image =
    page.page_banner ??
    cfg.page_banner.overrides[key] ??
    cfg.page_banner.overrides[type] ??
    cfg.page_banner.default;
  if (image === false || !image?.src || !cfg.appearance.show_cover) return "";
  return `<div class="page-banner" style="--banner-height:${cfg.page_banner.height}px">${this.hg_picture(image, "banner-media", true)}</div>`;
});
hexo.extend.helper.register("hg_background", function () {
  const cfg = hexo.theme.config.background;
  if (
    !cfg.image?.src ||
    cfg.mode === "paper" ||
    (cfg.mode === "home" && !this.is_home())
  )
    return "";
  return `<div class="environment" aria-hidden="true" style="opacity:${cfg.opacity}">${this.hg_picture(cfg.image, "environment-media", false, true)}</div>`;
});
hexo.extend.helper.register(
  "hg_image_bootstrap",
  () => "(" + require("../lib/image-bootstrap.cjs").toString() + ")();",
);
hexo.extend.helper.register("hg_masthead_action", function () {
  const configured = hexo.theme.config.home.masthead.action.url;
  if (configured) return configured;
  const archive =
    String(hexo.config.archive_dir || "archives").replace(/^\/+|\/+$/g, "") +
    "/";
  return hexo.locals.get("posts").length &&
    hexo.route.list().includes(archive + "index.html")
    ? "/" + archive
    : "";
});
