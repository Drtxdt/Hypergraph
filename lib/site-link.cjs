"use strict";
function siteLink(value, config) {
  value = String(value || "");
  const root = "/" + String(config.root || "/").replace(/^\/+|\/+$/g, "") + "/";
  const base = new URL(root === "//" ? "/" : root, config.url);
  const url = new URL(value, base);
  if (!["http:", "https:", "mailto:"].includes(url.protocol)) return "#";
  if (url.origin !== base.origin || url.protocol === "mailto:") return url.href;
  const prefix = base.pathname;
  if (value.startsWith("/") && !value.startsWith("//") && prefix !== "/" &&
      url.pathname !== prefix.slice(0, -1) && !url.pathname.startsWith(prefix))
    url.pathname = prefix + url.pathname.slice(1);
  if (url.pathname === prefix.slice(0, -1)) url.pathname = prefix;
  return url.pathname + url.search + url.hash;
}
module.exports = { siteLink };
