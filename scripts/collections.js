"use strict";
const { escape } = require("../lib/utils.cjs");
const types = [
  "about",
  "friends",
  "gallery",
  "essay",
  "equipment",
  "music",
  "room",
  "fcircle",
];
hexo.extend.generator.register("hypergraph-collections", (locals) => {
  const pages = hexo.theme.config.pages || {};
  return types
    .filter((type) => pages[type]?.enable)
    .map((type) => ({
      path:
        (pages[type].path || type + "/")
          .replace(/^\//, "")
          .replace(/\/?$/, "/") + "index.html",
      layout: "collection",
      data: {
        title: pages[type].title || type,
        type,
        items: locals.data.hypergraph?.[type] || [],
        description: pages[type].description || "",
        remote: pages[type].endpoint || "",
      },
    }));
});
