"use strict";
hexo.extend.generator.register("hypergraph-pwa", () => {
  if (!hexo.theme.config.pwa?.enable) return [];
  const root = hexo.config.root;
  const lang = String(hexo.config.language).startsWith("en") ? "en" : "zh-CN";
  const t = require("../lib/i18n.cjs")[lang];
  const cache = "hypergraph-" + Buffer.from(root).toString("hex") + "-v2";
  return [
    {
      path: "manifest.webmanifest",
      data: JSON.stringify({
        name: hexo.config.title,
        short_name: hexo.config.title,
        start_url: root,
        scope: root,
        display: "standalone",
        background_color: "#f3f2ec",
        theme_color: "#202421",
        icons: hexo.theme.config.pwa.icons.length
          ? hexo.theme.config.pwa.icons
          : [
              {
                src: root + "hypergraph.svg",
                sizes: "any",
                type: "image/svg+xml",
                purpose: "any",
              },
            ],
      }),
    },
    {
      path: "offline.html",
      data: `<!doctype html><html lang="${lang}"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${t.offline}</title><h1>${t.offline}</h1><p>${t.reconnect}</p><button onclick="location.reload()">${t.retry}</button></html>`,
    },
    {
      path: "sw.js",
      data: `const CACHE=${JSON.stringify(cache)};const OFFLINE=${JSON.stringify(root + "offline.html")};self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.add(OFFLINE)).then(()=>self.skipWaiting())));self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',e=>{if(e.request.mode==='navigate')e.respondWith(fetch(e.request).catch(()=>caches.open(CACHE).then(c=>c.match(OFFLINE))));});`,
    },
  ];
});
