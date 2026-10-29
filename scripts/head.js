"use strict";
const { escape } = require("../lib/utils.cjs");
hexo.extend.helper.register("hg_head", function () {
  const cfg = hexo.theme.config;
  const appearance = cfg.appearance;
  const font = (value) => String(value).replace(/[<>;{}]/g, "");
  let output = `<style>html[data-mode]{--signal:${cfg.colors.accent};--body-font:${font(cfg.fonts.body)};--display-font:${font(cfg.fonts.display)};--code-font:${font(cfg.fonts.code)};--code-white-space:${cfg.code.wrap ? "pre-wrap" : "pre"}}html .prose{font-size:${cfg.fonts.body_size}px;line-height:${cfg.fonts.line_height}}html .prose pre,html .prose figure.highlight{font-size:${cfg.fonts.code_size}px}`;
  if (cfg.background.image)
    output += `body:before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;background:url(${JSON.stringify(this.url_for(cfg.background.image)).replace(/</g, "\\3c ")} ) center/cover;opacity:${cfg.background.opacity}}`;
  output += `.collection-card,.feature,.link-card{border-radius:${appearance.radius}px}.prose{text-align:${appearance.justify ? "justify" : "start"}}`;
  if (
    appearance.grayscale ||
    (this.is_home() &&
      appearance.mourn_days.includes(new Date().toISOString().slice(5, 10)))
  )
    output += "html{filter:grayscale(1)}";
  if (appearance.table_stripes)
    output += ".prose tbody tr:nth-child(even){background:var(--surface)}";
  if (!appearance.heading_divider) output += ".prose h2{border:0}";
  if (appearance.note_style === "simple")
    output += ".admonition{background:transparent}";
  if (appearance.note_style === "off")
    output += ".admonition{background:transparent;border:0;padding:0}";
  if (appearance.divider_icon)
    output += `.prose hr:after{content:${JSON.stringify(appearance.divider_icon).replace(/</g, "\\3c ")};background:var(--paper);padding:0 1rem}.prose hr{text-align:center;overflow:visible;height:0}`;
  if (appearance.footer_image)
    output += `.site-footer{background:linear-gradient(color-mix(in srgb,var(--paper) 85%,transparent),color-mix(in srgb,var(--paper) 85%,transparent)),url(${JSON.stringify(this.url_for(appearance.footer_image)).replace(/</g, "\\3c ")} ) center/cover}`;
  output += "</style>";
  if (appearance.favicon)
    output += `<link rel="icon" href="${escape(this.url_for(appearance.favicon))}">`;
  const palette = (values) =>
    Object.entries(values || {})
      .map(([name, value]) => `--${name}:${value}`)
      .join(";");
  const light = palette(cfg.colors.light),
    dark = palette(cfg.colors.dark);
  output += `<style>html:root[data-mode="light"],html:root[data-mode="auto"]{${light}}html:root[data-mode="dark"]{${dark}}@media(prefers-color-scheme:dark){html:root[data-mode="auto"]{${dark}}}</style>`;
  if (cfg.pwa.enable)
    output += `<link rel="manifest" href="${escape(this.url_for("/manifest.webmanifest"))}"><meta name="theme-color" content="#202421">`;
  if (cfg.feeds.rss)
    output += `<link rel="alternate" type="application/atom+xml" href="${escape(this.url_for("/atom.xml"))}" title="${escape(hexo.config.title)}">`;
  return (
    output +
    (hexo.hypergraphPreset?.css
      ? "<style>" + hexo.hypergraphPreset.css + "</style>"
      : "") +
    cfg.inject.head.join("\n")
  );
});
