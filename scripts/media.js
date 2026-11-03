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
  if (!cfg.image?.src || cfg.mode === "paper") return "";
  return `<div class="environment" aria-hidden="true" style="opacity:${cfg.opacity}">${this.hg_picture(cfg.image, "environment-media", false, true).replace(/<noscript>[\s\S]*?<\/noscript>/, cfg.mode === "home" && !this.is_home() ? "" : "$&")}</div>`;
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
const contours = () => require("../source/assets/contours.json");
hexo.extend.helper.register("hg_merged_brand", function () {
  const cfg = hexo.theme.config, masthead = cfg.home.masthead;
  return masthead.artwork.enable &&
    !(cfg.appearance.show_cover && (masthead.image.src || masthead.artwork.image.src || cfg.site_logo)) &&
    String(cfg.home.title || hexo.config.title).trim() === String(hexo.config.title).trim();
});
hexo.extend.helper.register("hg_artwork", function () {
  const cfg = hexo.theme.config,
    masthead = cfg.home.masthead;
  if (
    this.hg_merged_brand() || !masthead.artwork.enable ||
    (cfg.appearance.show_cover && masthead.image.src)
  )
    return "";
  if (masthead.artwork.image.src && cfg.appearance.show_cover)
    return this.hg_picture(
      { ...masthead.artwork.image, fit: "contain" },
      "masthead-artwork",
      true,
    ).replace("<figure ", '<figure aria-hidden="true" ');
  if (cfg.site_logo && cfg.appearance.show_cover)
    return this.hg_picture(
      { src: cfg.site_logo, fit: "contain" },
      "masthead-artwork",
      true,
    ).replace("<figure ", '<figure aria-hidden="true" ');
  return `<figure class="masthead-artwork wordmark-artwork" aria-hidden="true"><span class="site-wordmark">${escape(hexo.config.title || "Hypergraph")}</span></figure>`;
});
hexo.extend.helper.register("hg_contour", function (page) {
  const cfg = hexo.theme.config.appearance.contour;
  if (!cfg.enable) return "";
  return `<div class="contour-layer ${this.is_home() ? "contour-home" : "contour-band"}" aria-hidden="true" style="--contour-opacity:${cfg.opacity};--contour-image:url('${this.url_for("/assets/" + contours()[cfg.style])}');--contour-lower-image:url('${this.url_for("/assets/" + contours()[cfg.style + "Lower"])}');--contour-band-image:url('${this.url_for("/assets/" + contours()[cfg.style + "Band"])}');--contour-mobile-image:url('${this.url_for("/assets/" + contours()[cfg.style + "Mobile"])}')"></div>`;
});

hexo.extend.helper.register("hg_contour_active", function (page) {
  const cfg = hexo.theme.config.appearance.contour;
  return String(
    cfg.enable &&
      page.layout !== "utility" &&
      (cfg.scope === "site" || this.is_home()),
  );
});
hexo.extend.helper.register("hg_background_active", function () {
  const cfg = hexo.theme.config.background;
  return String(
    !!cfg.image?.src &&
      cfg.mode !== "paper" &&
      (cfg.mode !== "home" || this.is_home()),
  );
});

hexo.extend.helper.register("hg_contour_band", function (page) {
  if (this.hg_contour_active(page) !== "true") return "";
  const cfg = hexo.theme.config.appearance.contour;
  return `<div class="chapter-terrain" aria-hidden="true" style="--contour-band-image:url('${this.url_for("/assets/" + contours()[cfg.style + "Band"])}');--contour-opacity:${cfg.opacity}"></div>`;
});
